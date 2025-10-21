import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { catchError, Observable, throwError, timeout, TimeoutError } from 'rxjs';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly ms: number;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.ms = Number(this.config.get('HTTP_TIMEOUT_MS') ?? 8000);
    this.logger.setContext('TimeoutInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<{ method?: string; originalUrl?: string; id?: string }>();
    const meta = {
      method: req.method,
      path: req.originalUrl,
      requestId: req.id,
      timeoutMs: this.ms,
    };

    return next.handle().pipe(
      timeout({ each: this.ms }),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          this.logger.warn(meta, 'Request timed out');
          return throwError(() => new RequestTimeoutException('Request timed out'));
        }
        return throwError(() => err);
      }),
    );
  }
}

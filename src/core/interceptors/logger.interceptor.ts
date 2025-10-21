import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { RequestUser } from '@starment/shared';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggerInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { id?: string; user?: RequestUser }>();
    const res = context.switchToHttp().getResponse<Response>();

    const { method, url } = req;
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const userId = req.user?.id ?? 'anonymous';
    // req.id is set by RequestTracingMiddleware, but may not be present if error occurs before middleware
    const requestId: string | undefined = req.id || (req.headers['x-request-id'] as string);

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const status = res.statusCode;

        this.logger.info(
          {
            method,
            url,
            status,
            duration,
            controller,
            handler,
            userId,
            requestId,
          },
          'Request completed',
        );
      }),
    );
  }
}

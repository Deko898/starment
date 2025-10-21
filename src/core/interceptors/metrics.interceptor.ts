import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { MetricsService } from '@starment/metrics';
import { Observable, tap } from 'rxjs';

/**
 * Type guard to check if error has a status property
 */
function hasStatusProperty(err: unknown): err is { status: number } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof (err as { status: unknown }).status === 'number'
  );
}

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{ method?: string; route?: { path?: string } }>();
    const method = (req.method ?? 'GET').toUpperCase();
    // route path is only available after routing; best-effort:
    const route = req.route?.path ?? req.route?.path ?? 'unknown';

    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          const res = ctx.switchToHttp().getResponse<{ statusCode?: number }>();
          const status = String(res.statusCode ?? 200);
          this.metrics.httpRequests.labels(method, route, status).observe(Date.now() - start);
        },
        error: (err: unknown) => {
          const res = ctx.switchToHttp().getResponse<{ statusCode?: number }>();
          const errorStatus = hasStatusProperty(err) ? err.status : 500;
          const status = String(res.statusCode ?? errorStatus);
          this.metrics.httpErrors.labels(method, route, status).inc();
          this.metrics.httpRequests.labels(method, route, status).observe(Date.now() - start);
        },
      }),
    );
  }
}

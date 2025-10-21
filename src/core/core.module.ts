import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MetricsModule, MetricsService } from '@starment/metrics';
import { setSupabaseDaoMetrics } from '@starment/supabase';
import { PinoLogger } from 'nestjs-pino';

import { GlobalHttpExceptionFilter } from './filters';
import { AuthJwtGuard } from './guards';
import { HttpMetricsInterceptor, LoggerInterceptor, TimeoutInterceptor } from './interceptors';
import { RequestTracingMiddleware } from './middlewares';

@Module({
  imports: [
    ConfigModule,
    MetricsModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get('THROTTLER_TTL_SECONDS') ?? 60),
          limit: Number(config.get('THROTTLER_LIMIT') ?? 20),
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },

    // Auth guard (explicitly registered for proper DI)
    AuthJwtGuard,
  ],
  exports: [
    // Export guard so other modules can use it
    AuthJwtGuard,
  ],
})
export class CoreModule implements NestModule, OnModuleInit {
  constructor(
    private readonly metrics: MetricsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CoreModule.name);
  }

  onModuleInit(): void {
    setSupabaseDaoMetrics(this.metrics);
    this.logger.info('✅ Metrics linked to Supabase DAO layer');
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestTracingMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}

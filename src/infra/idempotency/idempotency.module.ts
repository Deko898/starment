import { Module } from '@nestjs/common';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';

/**
 * Idempotency module for request deduplication.
 *
 * Provides IdempotencyInterceptor for preventing duplicate requests.
 *
 * Usage:
 * 1. Import this module (already imported globally via CacheModule dependency)
 * 2. Use @Idempotent() decorator on routes or controllers
 *
 * @example
 * ```typescript
 * import { Idempotent } from '@starment/idempotency';
 *
 * @Controller('orders')
 * export class OrdersController {
 *   @Post()
 *   @Idempotent()
 *   createOrder(@Body() dto: CreateOrderDto) {
 *     return this.ordersService.create(dto);
 *   }
 * }
 * ```
 */
@Module({
  providers: [IdempotencyInterceptor],
  exports: [IdempotencyInterceptor],
})
export class IdempotencyModule {}

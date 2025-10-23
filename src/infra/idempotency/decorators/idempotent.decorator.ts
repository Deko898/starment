import { UseInterceptors, applyDecorators, SetMetadata } from '@nestjs/common';
import { IdempotencyInterceptor, IdempotencyConfig } from '../interceptors/idempotency.interceptor';

/**
 * Metadata key for idempotency configuration
 */
export const IDEMPOTENCY_CONFIG_KEY = 'idempotency:config';

/**
 * Apply idempotency to a route or controller.
 *
 * Prevents duplicate requests from being processed multiple times by caching responses
 * based on idempotency keys.
 *
 * @param config Optional configuration
 *
 * @example
 * // Basic usage - requires client to send Idempotency-Key header
 * @Post('orders')
 * @Idempotent()
 * async createOrder(@Body() dto: CreateOrderDto) {
 *   return this.ordersService.create(dto);
 * }
 *
 * @example
 * // Auto-generate keys based on request fingerprint
 * @Post('orders')
 * @Idempotent({ autoGenerateKey: true })
 * async createOrder(@Body() dto: CreateOrderDto) {
 *   return this.ordersService.create(dto);
 * }
 *
 * @example
 * // Custom TTL (1 hour)
 * @Post('payments')
 * @Idempotent({ ttl: 3600 })
 * async processPayment(@Body() dto: PaymentDto) {
 *   return this.paymentsService.process(dto);
 * }
 *
 * @example
 * // Apply to entire controller
 * @Controller('orders')
 * @Idempotent({ autoGenerateKey: true })
 * export class OrdersController {
 *   // All POST/PUT/PATCH routes will be idempotent
 * }
 */
export function Idempotent(config?: IdempotencyConfig) {
  return applyDecorators(
    SetMetadata(IDEMPOTENCY_CONFIG_KEY, config || {}),
    UseInterceptors(IdempotencyInterceptor),
  );
}

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public routes
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark routes as public (skip authentication)
 * Use this on routes that should be accessible without authentication
 *
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * async login(@Body() dto: LoginDto) {
 *   return this.authService.login(dto.email, dto.password);
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

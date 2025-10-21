import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Auth feature module
 * Handles authentication operations (login, register, logout, refresh)
 *
 * Note: AuthJwtGuard is in @starment/core, not here.
 *       IAuthProvider is provided globally by SupabaseAuthModule.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

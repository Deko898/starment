import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthJwtGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, AuthJwtGuard],
  exports: [AuthService, AuthJwtGuard],
})
export class AuthModule {}

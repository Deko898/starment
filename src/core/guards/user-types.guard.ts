import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser, UserType } from '@starment/shared';

import { USER_TYPES_KEY } from '../decorators';

/**
 * User types guard - checks if user has required user type
 * Use with @UserTypes() decorator
 * Requires user to be authenticated first (use with AuthGuard)
 */
@Injectable()
export class UserTypesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredTypes = this.reflector.getAllAndOverride<UserType[] | undefined>(
      USER_TYPES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    // If no types are required, allow access
    if (!requiredTypes || requiredTypes.length === 0) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!requiredTypes.includes(req.user.user_type)) {
      throw new ForbiddenException(`Required user type: ${requiredTypes.join(', ')}`);
    }

    return true;
  }
}

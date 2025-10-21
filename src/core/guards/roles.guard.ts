import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser, Role } from '@starment/shared';

import { ROLES_KEY } from '../decorators';

/**
 * Roles guard - checks if user has required role
 * Use with @Roles() decorator
 * Requires user to be authenticated first (use with AuthGuard)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!requiredRoles.includes(req.user.role)) {
      throw new ForbiddenException(`Required role: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}

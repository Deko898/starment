import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, USER_TYPES_KEY } from '@starment/core';
import {
  getDisplayName,
  getRole,
  getUserType,
  type RequestWithUser,
  Role,
  type SupabaseUser,
  UserType,
} from '@starment/shared';
import { SUPABASE_ANON } from '@starment/supabase-dao';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthJwtGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_ANON)
    private readonly supabase: SupabaseClient,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const requiredUserTypes = this.reflector.getAllAndOverride<UserType[] | undefined>(
      USER_TYPES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    // If AuthContextInterceptor already populated req.user, skip auth check
    if (!req.user) {
      const authHeader: string | string[] | undefined =
        req.headers.authorization ?? req.headers.authorization;

      // Properly type the bearer token extraction with type guard
      let bearer: string | undefined;
      if (Array.isArray(authHeader)) {
        bearer = typeof authHeader[0] === 'string' ? authHeader[0] : undefined;
      } else if (typeof authHeader === 'string') {
        bearer = authHeader;
      }

      const accessToken: string | undefined = bearer?.startsWith('Bearer ')
        ? bearer.slice(7)
        : undefined;

      if (!accessToken) {
        throw new UnauthorizedException('Missing bearer token');
      }

      const { data, error } = await this.supabase.auth.getUser(accessToken);
      if (error) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const user = data.user as SupabaseUser;
      const role = getRole(user);
      const user_type = getUserType(user);
      const display_name = getDisplayName(user);

      req.user = {
        id: user.id,
        jwt: accessToken,
        role,
        user_type,
        email: user.email ?? undefined,
        display_name,
      };
    }

    // Use the role/user_type from req.user (populated by interceptor or above)
    const { role, user_type } = req.user;

    // ✅ Role check
    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new ForbiddenException(`Access denied. Required role: ${requiredRoles.join(', ')}`);
    }

    // ✅ User type check
    if (requiredUserTypes && !requiredUserTypes.includes(user_type)) {
      throw new ForbiddenException(
        `Access denied. Required user type: ${requiredUserTypes.join(', ')}`,
      );
    }

    return true;
  }
}

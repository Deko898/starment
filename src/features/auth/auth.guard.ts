import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, USER_TYPES_KEY } from '@starment/core';
import { type RequestWithUser, Role, UserType } from '@starment/shared';
import { AUTH_PROVIDER, type IAuthProvider } from '@starment/supabase';

/**
 * Auth guard - provider-agnostic
 * Uses IAuthProvider interface instead of SupabaseClient directly
 */
@Injectable()
export class AuthJwtGuard implements CanActivate {
  constructor(
    @Inject(AUTH_PROVIDER)
    private readonly authProvider: IAuthProvider,
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
      const accessToken = this.extractToken(req);

      if (!accessToken) {
        throw new UnauthorizedException('Missing bearer token');
      }

      // Use auth provider to validate token (provider-agnostic)
      const user = await this.authProvider.validateToken(accessToken);

      req.user = {
        id: user.id,
        jwt: accessToken,
        role: user.role,
        user_type: user.userType,
        email: user.email,
        display_name: user.displayName,
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

  /**
   * Extract bearer token from request headers
   * @private
   */
  private extractToken(req: RequestWithUser): string | undefined {
    const authHeader = req.headers.authorization;

    // Handle array case (shouldn't happen but Express types allow it)
    let bearer: string | undefined;
    if (Array.isArray(authHeader)) {
      bearer = typeof authHeader[0] === 'string' ? authHeader[0] : undefined;
    } else if (typeof authHeader === 'string') {
      bearer = authHeader;
    }

    return bearer?.startsWith('Bearer ') ? bearer.slice(7) : undefined;
  }
}

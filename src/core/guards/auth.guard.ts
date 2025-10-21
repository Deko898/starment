import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type RequestWithUser } from '@starment/shared';
import { AUTH_PROVIDER, type IAuthProvider } from '@starment/supabase';

/**
 * Authentication guard - validates JWT and populates req.user
 * Use this guard to ensure the user is authenticated
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_PROVIDER)
    private readonly authProvider: IAuthProvider,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();

    if (req.user) {
      return true; // Already authenticated
    }

    const accessToken = this.extractToken(req);
    if (!accessToken) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const user = await this.authProvider.validateToken(accessToken);

    req.user = {
      id: user.id,
      jwt: accessToken,
      role: user.role,
      user_type: user.userType,
      email: user.email,
      display_name: user.displayName,
    };

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

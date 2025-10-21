import { Inject, Injectable } from '@nestjs/common';
import { Role, UserType, normalizeError } from '@starment/shared';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_ANON } from '../../config/supabase-dao.tokens';
import type {
  AuthResult,
  AuthSession,
  AuthUser,
  IAuthProvider,
  UserMetadata,
} from '../interfaces/auth-provider.interface';

/**
 * Supabase implementation of IAuthProvider
 * This is the ONLY file that should import Supabase auth types
 */
@Injectable()
export class SupabaseAuthAdapter implements IAuthProvider {
  constructor(@Inject(SUPABASE_ANON) private readonly supabase: SupabaseClient) {}

  async register(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw normalizeError(error);
    }

    if (!data.session) {
      return {
        requiresConfirmation: true,
        message: 'Account created. Please check your email to confirm your account.',
      };
    }

    return {
      user: this.mapUser(data.user),
      session: this.mapSession(data.session),
      requiresConfirmation: false,
    };
  }

  async registerWithMetadata(
    email: string,
    password: string,
    metadata: UserMetadata,
  ): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      throw normalizeError(error);
    }

    if (!data.session) {
      return {
        requiresConfirmation: true,
        message: 'Account created. Please check your email to confirm your account.',
      };
    }

    return {
      user: this.mapUser(data.user),
      session: this.mapSession(data.session),
      requiresConfirmation: false,
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw normalizeError(error);
    }

    return {
      user: this.mapUser(data.user),
      session: this.mapSession(data.session),
      requiresConfirmation: false,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw normalizeError(error);
    }

    return {
      user: this.mapUser(data.user),
      session: this.mapSession(data.session),
      requiresConfirmation: false,
    };
  }

  async logout(jwt: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.signOut(jwt);

    if (error) {
      throw normalizeError(error);
    }
  }

  async validateToken(jwt: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.getUser(jwt);

    if (error) {
      throw normalizeError(error);
    }

    return this.mapUser(data.user);
  }

  /**
   * Map Supabase user to our provider-agnostic AuthUser
   * @private
   */
  private mapUser(supabaseUser: any): AuthUser {
    // Extract role from app_metadata or user_metadata
    const role: Role =
      supabaseUser.app_metadata?.role ||
      supabaseUser.user_metadata?.roles?.[0] ||
      Role.USER;

    // Extract user type
    const userType: UserType = supabaseUser.user_metadata?.user_type || UserType.FAN;

    // Extract display name with fallbacks
    const displayName: string =
      supabaseUser.user_metadata?.display_name ||
      supabaseUser.user_metadata?.full_name ||
      `${supabaseUser.user_metadata?.first_name ?? ''} ${supabaseUser.user_metadata?.last_name ?? ''}`.trim() ||
      supabaseUser.email ||
      'Unknown User';

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role,
      userType,
      displayName,
      metadata: supabaseUser.user_metadata || {},
    };
  }

  /**
   * Map Supabase session to our provider-agnostic AuthSession
   * @private
   */
  private mapSession(supabaseSession: any): AuthSession {
    const user = this.mapUser(supabaseSession.user);

    return {
      userId: supabaseSession.user.id,
      email: supabaseSession.user.email,
      accessToken: supabaseSession.access_token,
      refreshToken: supabaseSession.refresh_token,
      expiresIn: supabaseSession.expires_in,
      role: user.role,
      userType: user.userType,
    };
  }
}

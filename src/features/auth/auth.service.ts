import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { normalizeError } from '@starment/shared';
import { SUPABASE_ANON } from '@starment/supabase-dao';
import { SupabaseClient } from '@supabase/supabase-js';

import { RegisterCreatorDto } from './dto';
import { LoginResponse } from './models';
import { toLoginResponse } from './utils';

@Injectable()
export class AuthService {
  constructor(@Inject(SUPABASE_ANON) private readonly supabase: SupabaseClient) {}

  async register(email: string, password: string): Promise<LoginResponse | { message: string }> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw normalizeError(error);
    }

    if (!data.session) {
      return {
        message: 'Account created. Please check your email to confirm your account.',
      };
    }

    return toLoginResponse(data.session);
  }

  async registerCreator(dto: RegisterCreatorDto): Promise<{ message: string } | LoginResponse> {
    const { data, error } = await this.supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          user_type: 'creator',
          display_name: dto.display_name,
          legal_name: dto.legal_name,
          country_code: dto.country_code,
          largest_following_platform: dto.largest_following_platform,
          social_handle: dto.social_handle,
          follower_count: dto.follower_count,
          phone: dto.phone,
        },
      },
    });

    // ✅ Direct Supabase error handling
    if (error) {
      throw normalizeError(error);
    }

    // ✅ Safe null check without assertion
    if (!data.session) {
      return {
        message: 'Account created. Please check your email to confirm your account.',
      };
    }

    return toLoginResponse(data.session);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw normalizeError(error);
    }

    return toLoginResponse(data.session);
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw normalizeError(error);
    }

    return toLoginResponse(data.session);
  }

  async logout(jwt: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.signOut(jwt);

    if (error) {
      throw normalizeError(error);
    }
  }
}

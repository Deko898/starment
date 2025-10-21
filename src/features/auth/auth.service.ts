import { Inject, Injectable } from '@nestjs/common';
import { AUTH_PROVIDER, type IAuthProvider } from '@starment/supabase';

import { RegisterCreatorDto } from './dto';
import { LoginResponse } from './models';
import { toLoginResponse } from './utils';

/**
 * Auth service - provider-agnostic
 * Uses IAuthProvider interface instead of SupabaseClient directly
 */
@Injectable()
export class AuthService {
  constructor(@Inject(AUTH_PROVIDER) private readonly authProvider: IAuthProvider) {}

  async register(email: string, password: string): Promise<LoginResponse | { message: string }> {
    const result = await this.authProvider.register(email, password);

    if (result.requiresConfirmation) {
      return {
        message:
          result.message || 'Account created. Please check your email to confirm your account.',
      };
    }

    return toLoginResponse(result.session!);
  }

  async registerCreator(dto: RegisterCreatorDto): Promise<{ message: string } | LoginResponse> {
    const result = await this.authProvider.registerWithMetadata(dto.email, dto.password, {
      userType: 'creator',
      displayName: dto.display_name,
      // Map DTO fields to metadata
      legal_name: dto.legal_name,
      countryCode: dto.country_code,
      largest_following_platform: dto.largest_following_platform,
      social_handle: dto.social_handle,
      follower_count: dto.follower_count,
      phone: dto.phone,
    });

    if (result.requiresConfirmation) {
      return {
        message:
          result.message || 'Account created. Please check your email to confirm your account.',
      };
    }

    return toLoginResponse(result.session!);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const result = await this.authProvider.login(email, password);
    return toLoginResponse(result.session!);
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const result = await this.authProvider.refresh(refreshToken);
    return toLoginResponse(result.session!);
  }

  async logout(jwt: string): Promise<void> {
    await this.authProvider.logout(jwt);
  }
}

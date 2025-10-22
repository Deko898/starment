import { Inject, Injectable } from '@nestjs/common';
import { CACHE_PROVIDER, type ICacheProvider } from '@starment/cache';
import { BaseApiService } from '@starment/core';
import { Profile } from '@starment/supabase';

import { ProfileResponse } from './models';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService extends BaseApiService<Profile> {
  constructor(
    private readonly profileRepo: ProfileRepository,
    @Inject(CACHE_PROVIDER) private readonly cache: ICacheProvider,
  ) {
    super(profileRepo);
  }

  async getCreatorProfile(userId: string): Promise<ProfileResponse> {
    const cacheKey = `profile:creator:${userId}`;

    // Try to get from cache first
    const cached = await this.cache.get<ProfileResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const result = await this.profileRepo.getCreatorProfile(userId);
    const profile = this.unwrap(result, 'Creator profile');
    const response = ProfileResponse.fromDb(profile);

    // Store in cache with 5 minute TTL (300 seconds)
    // Note: CACHE_PROVIDER accepts seconds, converts to ms internally
    await this.cache.set(cacheKey, response, 300);

    return response;
  }
}

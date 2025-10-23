import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BaseApiService } from '@starment/core';
import { Profile } from '@starment/supabase';

import { ProfileResponse } from './models';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService extends BaseApiService<Profile> {
  constructor(
    private readonly profileRepo: ProfileRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(profileRepo);
  }

  async getCreatorProfile(userId: string): Promise<ProfileResponse> {
    const cacheKey = `profile:creator:${userId}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get<ProfileResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const result = await this.profileRepo.getCreatorProfile(userId);
    const profile = this.unwrap(result, 'Creator profile');
    const response = ProfileResponse.fromDb(profile);

    // Store in cache with 5 minute TTL (300000ms)
    await this.cacheManager.set(cacheKey, response, 300000);

    return response;
  }
}

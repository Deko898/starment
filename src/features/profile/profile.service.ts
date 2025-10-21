import { Injectable } from '@nestjs/common';
import { BaseApiService } from '@starment/core';
import { Profile } from '@starment/supabase';

import { ProfileResponse } from './models';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService extends BaseApiService<Profile> {
  constructor(private readonly profileRepo: ProfileRepository) {
    super(profileRepo);
  }

  async getCreatorProfile(userId: string): Promise<ProfileResponse> {
    const result = await this.profileRepo.getCreatorProfile(userId);

    const profile = this.unwrap(result, 'Creator profile');

    return ProfileResponse.fromDb(profile);
  }
}

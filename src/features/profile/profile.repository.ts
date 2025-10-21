import { Inject, Injectable } from '@nestjs/common';
import {
  BaseRepository,
  type DatabaseAdapter,
  DbSingleResponse,
  makeTableToken,
  Profile,
} from '@starment/supabase-dao';

import { CreatorProfileWithRelations } from './models';
import { CREATOR_PROFILE_QUERY } from './queries';

@Injectable()
export class ProfileRepository extends BaseRepository<Profile> {
  constructor(
    @Inject(makeTableToken('profiles'))
    adapter: DatabaseAdapter<Profile>,
  ) {
    super(adapter);
  }

  async getCreatorProfile(userId: string): Promise<DbSingleResponse<CreatorProfileWithRelations>> {
    const result = await this.adapter.findById(userId, {
      columns: CREATOR_PROFILE_QUERY,
    });

    return {
      ...result,
      data: result.data as unknown as CreatorProfileWithRelations,
    };
  }
}

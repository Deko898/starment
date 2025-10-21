import { Module } from '@nestjs/common';
import { SupabaseDaoModule } from '@starment/supabase';

import { ProfileController } from './profile.controller';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';

@Module({
  imports: [SupabaseDaoModule.forTables(['profiles'])],
  providers: [ProfileRepository, ProfileService],
  controllers: [ProfileController],
  exports: [ProfileService],
})
export class ProfileModule {}

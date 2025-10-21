import { Module } from '@nestjs/common';
import { AuthModule } from '@starment/auth';
import { getConfigModule } from '@starment/config';
import { CoreModule } from '@starment/core';
import { HealthModule } from '@starment/health';
import { StarmentLoggerModule } from '@starment/logger';
import { ProfileModule } from '@starment/profile';
import { SupabaseCoreModule } from '@starment/supabase-dao';

import { VideoTestModule } from './features/video-test/video-test.module';

@Module({
  imports: [
    getConfigModule(),
    StarmentLoggerModule.forRoot(),
    CoreModule,
    SupabaseCoreModule,
    HealthModule,

    VideoTestModule,

    AuthModule,
    ProfileModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '@starment/auth';
import { CacheModule } from '@starment/cache';
import { getConfigModule } from '@starment/config';
import { AuthGuard, CoreModule } from '@starment/core';
import { HealthModule } from '@starment/health';
import { StarmentLoggerModule } from '@starment/logger';
import { ProfileModule } from '@starment/profile';
import { SupabaseAuthModule, SupabaseCoreModule } from '@starment/supabase';

import { VideoTestModule } from './features/video-test/video-test.module';

@Module({
  imports: [
    getConfigModule(),
    StarmentLoggerModule.forRoot(),
    CoreModule,
    SupabaseCoreModule,
    SupabaseAuthModule, // Provides AUTH_PROVIDER globally
    CacheModule, // Provides CACHE_PROVIDER globally
    HealthModule,

    VideoTestModule,

    AuthModule,
    ProfileModule,
  ],
  providers: [
    // Global authentication guard (secure by default)
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}

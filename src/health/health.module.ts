import { Module } from '@nestjs/common';
import { SupabaseDaoModule } from '@starment/supabase';

import { HealthController } from './health.controller';
import { HealthRepository } from './health.repository';
import { HealthService } from './health.service';
import { CacheHealthIndicator } from './indicators/cache-health.indicator';
import { DatabaseHealthIndicator } from './indicators/database-health.indicator';

@Module({
  imports: [SupabaseDaoModule.forTables(['health_check'])],
  controllers: [HealthController],
  providers: [HealthService, HealthRepository, DatabaseHealthIndicator, CacheHealthIndicator],
  exports: [HealthService],
})
export class HealthModule {}

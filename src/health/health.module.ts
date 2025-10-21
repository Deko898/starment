import { Module } from '@nestjs/common';
import { SupabaseDaoModule } from '@starment/supabase-dao';

import { HealthController } from './health.controller';
import { HealthRepository } from './health.repository';
import { HealthService } from './health.service';

@Module({
  imports: [SupabaseDaoModule.forTables(['health_check'])],
  controllers: [HealthController],
  providers: [HealthService, HealthRepository],
  exports: [HealthService],
})
export class HealthModule {}

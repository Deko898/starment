import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '@starment/core';

import { HealthService } from './health.service';
import type { LivenessResponse } from './interfaces/liveness-response.interface';
import { ReadinessResponse } from './interfaces/readiness-response.interface';

@Public()
@SkipThrottle()
@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('healthz')
  liveness(): LivenessResponse {
    return this.health.liveness();
  }

  @Get('readyz')
  readiness(): Promise<ReadinessResponse> {
    return this.health.readiness();
  }
}

import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '@starment/core';

import { MetricsService } from './metrics.service';

@Public()
@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('/metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metrics.metrics();
  }
}

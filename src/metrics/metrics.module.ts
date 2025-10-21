import { Global, Module } from '@nestjs/common';
import { collectDefaultMetrics, Registry } from 'prom-client';

import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  providers: [
    MetricsService,
    {
      provide: Registry,
      useFactory: () => {
        const registry = new Registry();
        collectDefaultMetrics({ register: registry }); // process, heap, eventloop lag, etc.
        return registry;
      },
    },
  ],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule {}

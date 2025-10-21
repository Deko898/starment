import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  readonly httpRequests: Histogram;
  readonly httpErrors: Counter;
  readonly dbCallDuration: Histogram;

  // 🧩 Business metrics
  readonly creatorRegistrations: Counter;
  readonly videoCalls: Counter;
  readonly videoCallDuration: Histogram;

  constructor(private readonly registry: Registry) {
    // --- Technical metrics ---
    this.httpRequests = new Histogram({
      name: 'http_server_request_duration_ms',
      help: 'HTTP request duration in ms',
      labelNames: ['method', 'route', 'status'],
      buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
      registers: [this.registry],
    });

    this.httpErrors = new Counter({
      name: 'http_server_errors_total',
      help: 'HTTP errors count',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.dbCallDuration = new Histogram({
      name: 'db_call_duration_ms',
      help: 'DB call duration in ms',
      labelNames: ['label', 'outcome'], // outcome: ok|error|timeout
      buckets: [5, 10, 20, 50, 100, 200, 500, 1000, 2000],
      registers: [this.registry],
    });

    // --- Business metrics ---
    this.creatorRegistrations = new Counter({
      name: 'starment_creator_registrations_total',
      help: 'Total creator registrations',
      registers: [this.registry],
    });

    this.videoCalls = new Counter({
      name: 'starment_video_calls_total',
      help: 'Total video calls initiated',
      labelNames: ['type'], // optional: group by "private" | "group"
      registers: [this.registry],
    });

    this.videoCallDuration = new Histogram({
      name: 'starment_video_call_duration_seconds',
      help: 'Video call duration in seconds',
      buckets: [15, 30, 60, 120, 300, 600, 1800],
      registers: [this.registry],
    });
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }
}

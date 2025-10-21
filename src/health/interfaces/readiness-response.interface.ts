import type { CheckStatus } from './check-status.enum';

export interface ReadinessChecks {
  env: CheckStatus | string;
  supabase: CheckStatus;
  // add more checks here later, e.g. "redis", "queue", etc.
}

export interface ReadinessResponse {
  status: CheckStatus;
  service: string;
  timestamp: string;
  checks: ReadinessChecks;
}

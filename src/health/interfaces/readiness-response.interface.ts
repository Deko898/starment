import type { CheckStatus } from './check-status.enum';

export interface ReadinessChecks {
  env: CheckStatus | string;
  database: CheckStatus;
  cache: CheckStatus;
  // add more checks here later, e.g. "queue", "external-api", etc.
}

export interface ReadinessResponse {
  status: CheckStatus;
  service: string;
  timestamp: string;
  checks: ReadinessChecks;
}

import type { CheckStatus } from './check-status.enum';

export interface LivenessResponse {
  status: CheckStatus.OK;
  service: string;
  uptimeMs: number;
  timestamp: string;
  env: string;
}

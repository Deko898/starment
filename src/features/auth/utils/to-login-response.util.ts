import type { AuthSession } from '@starment/supabase';

import type { LoginResponse } from '../models';

/**
 * Convert provider-agnostic AuthSession to LoginResponse
 * No longer depends on Supabase types!
 */
export function toLoginResponse(session: AuthSession): LoginResponse {
  return {
    user_id: session.userId,
    email: session.email,
    role: session.role,
    user_type: session.userType,
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    expires_in: session.expiresIn,
  };
}

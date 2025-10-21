import { getRole, getUserType, type SupabaseUser } from '@starment/shared';
import type { Session } from '@supabase/supabase-js';

import type { LoginResponse } from '../models';

export function toLoginResponse(session: Session): LoginResponse {
  // Cast to our typed user interface
  const typedUser = session.user as SupabaseUser;

  // Use helper functions for safe property access
  const role = getRole(typedUser);
  const userType = getUserType(typedUser);

  return {
    user_id: session.user.id,
    email: session.user.email ?? undefined,
    role,
    user_type: userType,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
  };
}

import { env } from '@starment/config';
import type { RequestWithUser } from '@starment/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '../types';

const REQ_USER_CLIENT = Symbol.for('supabase.user.client');

/**
 * Extended request type that includes the cached Supabase client
 */
interface RequestWithClientCache extends RequestWithUser {
  [REQ_USER_CLIENT]?: SupabaseClient<Database>;
}

/**
 * Get or create a per-request Supabase client using the user's JWT.
 * Caches the instance on the request object to avoid multiple createClient() calls.
 */
export function getOrCreateUserClient(req: RequestWithUser): SupabaseClient<Database> | undefined {
  const jwt = req.user?.jwt;
  if (!jwt) {
    throw new Error('Missing user JWT for getOrCreateUserClient()');
  }

  const reqWithCache = req as RequestWithClientCache;

  if (!reqWithCache[REQ_USER_CLIENT]) {
    reqWithCache[REQ_USER_CLIENT] = createClient<Database>(
      env().supabaseUrl,
      env().supabaseAnonKey,
      {
        global: {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: `Bearer ${jwt}`,
          },
        },
      },
    );
  }

  return reqWithCache[REQ_USER_CLIENT];
}

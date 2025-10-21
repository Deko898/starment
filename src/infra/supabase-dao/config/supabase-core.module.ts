import { Global, Module } from '@nestjs/common';
import { env } from '@starment/config';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '../types/database.types';
import { SUPABASE_ADMIN, SUPABASE_ANON } from './supabase-dao.tokens';

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_ANON,
      useFactory: () => {
        const client = createClient<Database>(env().supabaseUrl, env().supabaseAnonKey);
        return client;
      },
    },
    {
      provide: SUPABASE_ADMIN,
      useFactory: () => {
        const client = createClient<Database>(env().supabaseUrl, env().supabaseServiceRoleKey);
        return client;
      },
    },
  ],
  exports: [SUPABASE_ANON, SUPABASE_ADMIN],
})
export class SupabaseCoreModule {}

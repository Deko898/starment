import { Global, Module } from '@nestjs/common';

import { AUTH_PROVIDER } from '../auth/interfaces/auth-provider.interface';
import { SupabaseAuthAdapter } from '../auth/adapters/supabase-auth.adapter';
import { SupabaseCoreModule } from './supabase-core.module';

/**
 * Global module that provides auth adapter
 * Import this in AppModule to make AUTH_PROVIDER available everywhere
 */
@Global()
@Module({
  imports: [SupabaseCoreModule],
  providers: [
    {
      provide: AUTH_PROVIDER,
      useClass: SupabaseAuthAdapter,
    },
  ],
  exports: [AUTH_PROVIDER],
})
export class SupabaseAuthModule {}

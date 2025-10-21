import { DynamicModule, Module, Provider, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { type RequestWithUser, Role } from '@starment/shared';
import { SupabaseClient } from '@supabase/supabase-js';
import { PinoLogger } from 'nestjs-pino';

import { makeAdapter } from '../supabase/supabase-dao.adapter';
import { getOrCreateUserClient } from '../supabase/supabase-dao.utils';
import type { Database } from '../types/database.types';
import { TableName } from '../types/supabase-dao.types';
import { SupabaseCoreModule } from './supabase-core.module';
import { makeTableToken, SUPABASE_ADMIN, SUPABASE_ANON } from './supabase-dao.tokens';

@Module({})
export class SupabaseDaoModule {
  static forTables(tables: TableName[]): DynamicModule {
    const tableProviders: Provider[] = tables.map((table) => ({
      provide: makeTableToken(table),
      scope: Scope.REQUEST,
      inject: [REQUEST, SUPABASE_ANON, SUPABASE_ADMIN, PinoLogger],
      useFactory: (
        request: RequestWithUser,
        anon: SupabaseClient<Database>,
        admin: SupabaseClient<Database>,
        logger: PinoLogger,
      ) => {
        logger.setContext(`SupabaseDao:${table}`);

        // Return lazy adapter that defers client selection until first use
        let cachedAdapter: ReturnType<typeof makeAdapter> | null = null;

        return new Proxy({} as ReturnType<typeof makeAdapter>, {
          get(_target, prop) {
            // Skip internal JS checks (Promise detection, symbols, etc.)
            if (prop === 'then' || typeof prop === 'symbol') {
              return undefined;
            }

            // Create adapter once per request when first real method is accessed
            if (!cachedAdapter) {
              let client: SupabaseClient<Database>;
              let clientType: string;

              if (request.user?.role === Role.ADMIN) {
                client = admin;
                clientType = `admin(${request.user.id})`;
              } else if (request.user?.jwt) {
                const userClient = getOrCreateUserClient(request);
                if (!userClient) {
                  throw new Error('Failed to create user client');
                }
                client = userClient;
                clientType = `user(${request.user.id})`;
              } else {
                client = anon;
                clientType = 'anon';
              }

              logger.debug(`[${table}] Using ${clientType} client`);
              cachedAdapter = makeAdapter(client, table);
            }

            return cachedAdapter[prop as keyof typeof cachedAdapter];
          },
        });
      },
    }));

    return {
      module: SupabaseDaoModule,
      imports: [SupabaseCoreModule],
      providers: [...tableProviders],
      exports: [...tableProviders],
    };
  }
}

import { Inject } from '@nestjs/common';

import { makeTableToken } from './supabase-dao.tokens';

export const InjectSupabaseDao = (table: string): ParameterDecorator =>
  Inject(makeTableToken(table));

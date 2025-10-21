export const SUPABASE_ANON = 'SUPABASE_ANON';
export const SUPABASE_ADMIN = 'SUPABASE_ADMIN';

export const makeTableToken = (table: string) => `SUPABASE_DAO:${table}` as const;

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * A type wrapper for hook payloads to ensure they are read-only inside hooks.
 * Prevents accidental mutation of objects (e.g., modifying a record in-place).
 */
export type HookContext<T> = Readonly<T>;

export type HookFn<T> = (payload: HookContext<T>) => Promise<T> | T;

export interface SupabaseDaoHooks<Row = any, Insert = any, Update = any> {
  beforeInsert?: HookFn<Insert>[];
  afterInsert?: HookFn<Row>[];
  beforeUpdate?: HookFn<Update>[];
  afterUpdate?: HookFn<Row>[];
}

/**
 * Utility to sequentially run all hooks and merge results.
 */
export async function runHooks<T>(hooks: (HookFn<T>[] | undefined)[], payload: T): Promise<T> {
  let result = payload;
  for (const group of hooks) {
    if (!group) {
      continue;
    }
    for (const fn of group) {
      result = await fn(result as HookContext<T>);
    }
  }
  return result;
}

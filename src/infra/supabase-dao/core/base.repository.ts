import type {
  DatabaseAdapter,
  DbArrayResponse,
  DbResponse,
  DbSingleResponse,
  FindManyOptions,
  RepositoryHooks,
} from './data-adapter.types';
import type { Entity, InsertOf, RowOf, UpdateOf } from './schema.types';

/**
 * Database-agnostic base repository with SINGLE generic parameter
 * TEntity contains Row, Insert, and Update types bundled together
 */
export abstract class BaseRepository<TEntity extends Entity> {
  protected readonly hooks: RepositoryHooks<RowOf<TEntity>, InsertOf<TEntity>, UpdateOf<TEntity>> =
    {};

  constructor(protected readonly adapter: DatabaseAdapter<TEntity>) {}

  registerHooks(
    hooks: RepositoryHooks<RowOf<TEntity>, InsertOf<TEntity>, UpdateOf<TEntity>>,
  ): void {
    Object.assign(this.hooks, hooks);
  }

  async findById(id: string | number, columns = '*'): Promise<DbSingleResponse<RowOf<TEntity>>> {
    return this.adapter.findById(id, { columns });
  }

  async findMany(opts?: FindManyOptions<RowOf<TEntity>>): Promise<DbArrayResponse<RowOf<TEntity>>> {
    return this.adapter.findMany(opts);
  }

  async findWhere(where: Partial<RowOf<TEntity>>): Promise<DbArrayResponse<RowOf<TEntity>>> {
    return this.adapter.findMany({ where });
  }

  async insertOne(payload: InsertOf<TEntity>): Promise<DbSingleResponse<RowOf<TEntity>>> {
    const prepared = this.hooks.beforeInsert
      ? await this.runHook(this.hooks.beforeInsert, payload)
      : payload;

    const result = await this.adapter.insertOne(prepared);

    if (result.data && this.hooks.afterInsert) {
      await this.runHook(this.hooks.afterInsert, result.data);
    }

    return result;
  }

  async updateById(
    id: string | number,
    patch: UpdateOf<TEntity>,
  ): Promise<DbSingleResponse<RowOf<TEntity>>> {
    const prepared = this.hooks.beforeUpdate
      ? await this.runHook(this.hooks.beforeUpdate, patch)
      : patch;

    const result = await this.adapter.updateById(id, prepared);

    if (result.data && this.hooks.afterUpdate) {
      await this.runHook(this.hooks.afterUpdate, result.data);
    }

    return result;
  }

  async deleteById(id: string | number): Promise<DbResponse<null>> {
    return this.adapter.deleteById(id);
  }

  async exists(where: Partial<RowOf<TEntity>>): Promise<boolean> {
    return this.adapter.exists(where);
  }

  async count(where?: Partial<RowOf<TEntity>>): Promise<number> {
    return this.adapter.count(where);
  }

  async findPaginated(
    opts: FindManyOptions<RowOf<TEntity>> = {},
  ): Promise<DbArrayResponse<RowOf<TEntity>>> {
    return this.adapter.findMany(opts);
  }

  private async runHook<T>(hook: (data: T) => Promise<T> | T, data: T): Promise<T> {
    return Promise.resolve(hook(data));
  }
}

/**
 * Database-agnostic base API service with SINGLE generic parameter
 * TEntity contains Row, Insert, and Update types bundled together
 */
import type {
  BaseRepository,
  DbArrayResponse,
  DbResponse,
  DbSingleResponse,
  Entity,
  FindManyOptions,
  InsertOf,
  RowOf,
  UpdateOf,
} from '@starment/supabase-dao';

import { BaseService } from './base.service';

/**
 * Database-agnostic base API service with SINGLE generic parameter
 * TEntity contains Row, Insert, and Update types bundled together
 */
export abstract class BaseApiService<TEntity extends Entity> extends BaseService {
  constructor(protected readonly repo: BaseRepository<TEntity>) {
    super();
  }

  // ============================================
  // Standard CRUD methods - returns DbResponse
  // ============================================

  async findMany(
    params?: FindManyOptions<RowOf<TEntity>>,
  ): Promise<DbArrayResponse<RowOf<TEntity>>> {
    return this.repo.findMany(params);
  }

  async findById(id: string): Promise<DbSingleResponse<RowOf<TEntity>>> {
    return this.repo.findById(id);
  }

  async create(payload: InsertOf<TEntity>): Promise<DbSingleResponse<RowOf<TEntity>>> {
    return this.repo.insertOne(payload);
  }

  async update(id: string, patch: UpdateOf<TEntity>): Promise<DbSingleResponse<RowOf<TEntity>>> {
    return this.repo.updateById(id, patch);
  }

  async delete(id: string): Promise<DbResponse<null>> {
    return this.repo.deleteById(id);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  BaseRepository,
  type DatabaseAdapter,
  HealthCheck,
  makeTableToken,
} from '@starment/supabase';

@Injectable()
export class HealthRepository extends BaseRepository<HealthCheck> {
  constructor(
    @Inject(makeTableToken('health_check'))
    adapter: DatabaseAdapter<HealthCheck>,
  ) {
    super(adapter);
  }
}

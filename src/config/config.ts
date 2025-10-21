import type { DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { makeSchema } from './env-validation';

export function getConfigModule(): Promise<DynamicModule> {
  return ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
    validationSchema: makeSchema(),
    validationOptions: { abortEarly: false },
  });
}

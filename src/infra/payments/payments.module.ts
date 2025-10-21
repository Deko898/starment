import { DynamicModule, Module } from '@nestjs/common';

import { PaymentsModuleOptions } from './interfaces';
import { PAYMENT_PROVIDER_MAP } from './payments.constants';
import { PAYMENT_PROVIDER } from './providers';
import { ConfigurableModuleClass } from './utils';

@Module({})
export class PaymentsModule extends ConfigurableModuleClass {
  static forRoot(options: PaymentsModuleOptions): DynamicModule {
    const providerEntry = PAYMENT_PROVIDER_MAP[options.provider];

    if (!providerEntry) {
      throw new Error(
        `Unsupported payment provider: ${options.provider}. Available providers: ${Object.keys(PAYMENT_PROVIDER_MAP).join(', ')}`,
      );
    }

    const { module: ModuleClass, provider } = providerEntry;

    return {
      module: PaymentsModule,
      imports: [ModuleClass.forRoot(options.extra)],
      providers: [{ provide: PAYMENT_PROVIDER, useClass: provider }],
      exports: [PAYMENT_PROVIDER],
    };
  }
}

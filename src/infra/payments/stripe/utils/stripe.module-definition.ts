import { ConfigurableModuleBuilder } from '@nestjs/common';

import type { StripeModuleOptions } from './stripe.interface';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<StripeModuleOptions>().setClassMethodName('forRoot').build();

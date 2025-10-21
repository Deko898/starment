import { Module } from '@nestjs/common';

import { StripeService } from './stripe.service';
import { ConfigurableModuleClass } from './utils';

@Module({
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule extends ConfigurableModuleClass {}

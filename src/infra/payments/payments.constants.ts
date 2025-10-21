import type { Type } from '@nestjs/common';

import type { ConfigurableModuleStatic, PaymentProviderMap } from './interfaces';
import { StripePaymentProvider } from './providers';
import { StripeModule } from './stripe';

/**
 * Registry of all available payment providers
 * Add new providers here to make them available in the system
 */
export const PAYMENT_PROVIDER_MAP: PaymentProviderMap = {
  stripe: {
    module: StripeModule as Type<unknown> & ConfigurableModuleStatic,
    provider: StripePaymentProvider,
  },
  // Future providers can be added here:
  // mangopay: {
  //   module: MangoPayModule as Type<unknown> & ConfigurableModuleStatic,
  //   provider: MangoPayPaymentProvider,
  // },
};

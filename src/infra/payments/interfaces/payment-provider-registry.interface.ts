import type { DynamicModule, Type } from '@nestjs/common';

import type { PaymentExtraOptions } from './payment.interface';

/**
 * Interface for modules that support dynamic configuration with forRoot
 */
export interface ConfigurableModuleStatic {
  forRoot: (options: PaymentExtraOptions) => DynamicModule;
}

/**
 * Represents a payment provider entry in the provider registry
 */
export interface PaymentProviderEntry {
  /** The NestJS module class that configures this provider (must expose `forRoot`) */
  module: Type<unknown> & ConfigurableModuleStatic;
  /** The provider class implementing payment logic */
  provider: Type<unknown>;
}

/**
 * Map of available payment providers
 * Defines all supported payment providers in the system
 */
export interface PaymentProviderMap {
  /** Stripe payment provider */
  stripe: PaymentProviderEntry;
  /** MangoPay payment provider (optional, for future implementation) */
  mangopay?: PaymentProviderEntry;
}

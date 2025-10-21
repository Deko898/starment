import { Inject, Injectable } from '@nestjs/common';

import { createStripeClient, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, type StripeClient } from './utils';

@Injectable()
export class StripeService {
  private readonly _stripeSdk: StripeClient;

  constructor(@Inject(MODULE_OPTIONS_TOKEN) private readonly options: typeof OPTIONS_TYPE) {
    this._stripeSdk = createStripeClient(this.options);
  }

  public get stripeSdk(): StripeClient {
    return this._stripeSdk;
  }
}

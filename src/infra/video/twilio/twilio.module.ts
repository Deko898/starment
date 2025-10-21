import { Module } from '@nestjs/common';

import { TwilioService } from './twilio.service';
import { ConfigurableModuleClass } from './utils';

@Module({
  providers: [TwilioService],
  exports: [TwilioService],
})
export class TwilioModule extends ConfigurableModuleClass {}

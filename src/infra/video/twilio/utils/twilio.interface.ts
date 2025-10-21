import type { ClientOpts } from 'twilio/lib/base/BaseTwilio';
import type Twilio from 'twilio/lib/rest/Twilio';

export type TwilioClient = Twilio;

export interface ExtraConfiguration {
  isGlobal?: boolean;
}

export interface TwilioModuleOptions extends ExtraConfiguration {
  accountSid: string | undefined;
  authToken: string | undefined;
  apiKeySid: string | undefined;
  apiKeySecret: string | undefined;
  options?: ClientOpts | undefined;
}

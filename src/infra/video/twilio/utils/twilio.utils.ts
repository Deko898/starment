import { Twilio } from 'twilio';

import type { TwilioClient } from './twilio.interface';
import type { OPTIONS_TYPE } from './twilio.module-definition';

export function createTwilioClient({
  accountSid,
  authToken,
  apiKeySid,
  apiKeySecret,
  options,
}: typeof OPTIONS_TYPE): TwilioClient {
  if (apiKeySid && apiKeySecret) {
    // ✅ API Key flow (for Video)
    return new Twilio(apiKeySid, apiKeySecret, { accountSid, ...options });
  }

  if (authToken) {
    // ✅ Auth Token flow (for Voice/SMS)
    return new Twilio(accountSid, authToken, options);
  }

  throw new Error('Twilio configuration error: You must provide either (authToken)');
}

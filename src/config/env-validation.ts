/* eslint-disable @typescript-eslint/naming-convention */
import * as Joi from 'joi';

export const commonSchema = {
  SERVICE_NAME: Joi.string().min(1).required(),
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_ANON_KEY: Joi.string().min(10).required(),
  // Comma-separated list of allowed origins. Empty => allow all in dev only.
  CORS_ORIGINS: Joi.string().allow('').default(''),
  THROTTLER_TTL_SECONDS: Joi.number().required(),
  THROTTLER_LIMIT: Joi.number().required(),
  ENABLE_SWAGGER: Joi.boolean().default(false),

  // ✅ Twilio core (always required)
  TWILIO_ACCOUNT_SID: Joi.string()
    .pattern(/^AC[a-zA-Z0-9]{32}$/)
    .required(),

  // ✅ Either Auth Token or API Key pair must be present
  TWILIO_AUTH_TOKEN: Joi.string().min(10).required(),
  TWILIO_API_KEY_SID: Joi.string()
    .pattern(/^SK[a-zA-Z0-9]{32}$/)
    .required(),
  TWILIO_API_KEY_SECRET: Joi.string().min(10).required(),

  // Optional if we use SMS/Voice
  TWILIO_PHONE_NUMBER: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),

  STRIPE_API_KEY: Joi.string().min(10).required(),
} as const;

export function makeSchema(): Joi.ObjectSchema {
  return Joi.object({
    ...commonSchema,
  });
}

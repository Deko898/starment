/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/**
 * Type-safe environment variables interface
 * This eliminates process.env['KEY'] bracket notation and provides better type safety
 */

export interface AppEnvironmentVariables {
  // Core application
  NODE_ENV: 'development' | 'production' | 'test';
  SERVICE_NAME: string;
  PORT: string;

  // Logging
  LOG_LEVEL: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

  // Supabase configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Database configuration
  DB_TIMEOUT_MS: string;
  DB_RETRIES: string;

  // HTTP configuration
  HTTP_TIMEOUT_MS: string;

  // Feature flags
  ENABLE_SWAGGER: 'true' | 'false';

  // URLs and endpoints
  BASE_URL: string;

  STRIPE_API_KEY: string;

  // Twilio configuration
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_API_KEY_SID: string;
  TWILIO_API_KEY_SECRET: string;
  TWILIO_PHONE_NUMBER?: string;
  TWILIO_TOKEN_TTL_SECONDS?: string;

  // Redis/Cache configuration
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;
  REDIS_DB?: string;
  REDIS_URL?: string;
  CACHE_TTL?: string; // Default TTL in milliseconds (Keyv standard)
  CACHE_MAX?: string; // Max items in memory cache (LRU size)

  // Optional environment variables (with defaults)
  REQUEST_TIMEOUT?: string;
  MAX_REQUEST_SIZE?: string;
  CORS_ORIGINS?: string;
}

/**
 * Type-safe environment variable getter with validation
 */
export class Environment {
  private static _instance: Environment;
  private readonly _env: AppEnvironmentVariables;

  private constructor() {
    this._env = this.loadAndValidate();
  }

  public static getInstance(): Environment {
    if (!Environment._instance) {
      Environment._instance = new Environment();
    }
    return Environment._instance;
  }

  private loadAndValidate(): AppEnvironmentVariables {
    const env = process.env as Record<string, string | undefined>;

    // Required environment variables
    const requiredVars = [
      'NODE_ENV',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_API_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_API_KEY_SID',
      'TWILIO_API_KEY_SECRET',
    ];

    const missing = requiredVars.filter((key) => !env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // After validation, we know these exist, so we can safely assert non-null
    const nodeEnv = env.NODE_ENV as 'development' | 'production' | 'test' | undefined;
    const logLevel = env.LOG_LEVEL as
      | 'trace'
      | 'debug'
      | 'info'
      | 'warn'
      | 'error'
      | 'fatal'
      | undefined;
    const enableSwagger = env.ENABLE_SWAGGER as 'true' | 'false' | undefined;

    return {
      // Core application
      NODE_ENV: nodeEnv ?? 'development',
      SERVICE_NAME: env.SERVICE_NAME ?? 'domaus-api',
      PORT: env.PORT ?? '3000',

      // Logging
      LOG_LEVEL: logLevel ?? (env.NODE_ENV === 'production' ? 'info' : 'debug'),

      // Supabase configuration (validated above, safe to assert non-null)
      SUPABASE_URL: env.SUPABASE_URL!,
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY!,

      STRIPE_API_KEY: env.STRIPE_API_KEY!,

      // Database configuration
      DB_TIMEOUT_MS: env.DB_TIMEOUT_MS ?? '2000',
      DB_RETRIES: env.DB_RETRIES ?? '2',

      // HTTP configuration
      HTTP_TIMEOUT_MS: env.HTTP_TIMEOUT_MS ?? '8000',

      // Feature flags
      ENABLE_SWAGGER: enableSwagger ?? 'false',

      // URLs and endpoints
      BASE_URL: env.BASE_URL ?? 'http://localhost:4200',

      // Optional with defaults
      REQUEST_TIMEOUT: env.REQUEST_TIMEOUT,
      MAX_REQUEST_SIZE: env.MAX_REQUEST_SIZE,
      CORS_ORIGINS: env.CORS_ORIGINS,

      // Twilio configuration (validated above, safe to assert non-null)
      TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID!,
      TWILIO_AUTH_TOKEN: env.TWILIO_AUTH_TOKEN!,
      TWILIO_API_KEY_SID: env.TWILIO_API_KEY_SID!,
      TWILIO_API_KEY_SECRET: env.TWILIO_API_KEY_SECRET!,
      TWILIO_PHONE_NUMBER: env.TWILIO_PHONE_NUMBER, // optional

      // Redis/Cache configuration (all optional with defaults)
      REDIS_HOST: env.REDIS_HOST,
      REDIS_PORT: env.REDIS_PORT,
      REDIS_PASSWORD: env.REDIS_PASSWORD,
      REDIS_DB: env.REDIS_DB,
      REDIS_URL: env.REDIS_URL,
      CACHE_TTL: env.CACHE_TTL,
      CACHE_MAX: env.CACHE_MAX,
    };
  }

  // Getters for type-safe access
  get nodeEnv(): 'development' | 'production' | 'test' {
    return this._env.NODE_ENV;
  }

  get serviceName(): string {
    return this._env.SERVICE_NAME;
  }

  get port(): number {
    return parseInt(this._env.PORT, 10);
  }

  get logLevel(): string {
    return this._env.LOG_LEVEL;
  }

  get supabaseUrl(): string {
    return this._env.SUPABASE_URL;
  }

  get supabaseAnonKey(): string {
    return this._env.SUPABASE_ANON_KEY;
  }

  get supabaseServiceRoleKey(): string {
    return this._env.SUPABASE_SERVICE_ROLE_KEY;
  }

  get dbTimeoutMs(): number {
    return parseInt(this._env.DB_TIMEOUT_MS, 10);
  }

  get dbRetries(): number {
    return parseInt(this._env.DB_RETRIES, 10);
  }

  get httpTimeoutMs(): number {
    return parseInt(this._env.HTTP_TIMEOUT_MS, 10);
  }

  get enableSwagger(): boolean {
    return this._env.ENABLE_SWAGGER === 'true';
  }

  get isSwaggerEnabled(): boolean {
    return this._env.ENABLE_SWAGGER === 'true';
  }

  get baseUrl(): string {
    return this._env.BASE_URL;
  }

  get isProduction(): boolean {
    return this._env.NODE_ENV === 'production';
  }

  get isDevelopment(): boolean {
    return this._env.NODE_ENV === 'development';
  }

  get isTest(): boolean {
    return this._env.NODE_ENV === 'test';
  }

  // Get raw environment object (for cases where you need it)
  get all(): AppEnvironmentVariables {
    return { ...this._env };
  }

  get stripesApiKey(): string {
    return this._env.STRIPE_API_KEY;
  }

  // ------------- TWILIO HELPERS -------------
  get twilioAccountSid(): string {
    return this._env.TWILIO_ACCOUNT_SID;
  }

  get twilioAuthToken(): string {
    return this._env.TWILIO_AUTH_TOKEN;
  }

  get twilioApiKeySid(): string {
    return this._env.TWILIO_API_KEY_SID;
  }

  get twilioApiKeySecret(): string {
    return this._env.TWILIO_API_KEY_SECRET;
  }

  get twilioPhoneNumber(): string | undefined {
    return this._env.TWILIO_PHONE_NUMBER;
  }

  get twilioTokenTtlSeconds(): number {
    return parseInt(this._env.TWILIO_TOKEN_TTL_SECONDS ?? '3600', 10);
  }

  // ------------- REDIS/CACHE HELPERS -------------
  get redisHost(): string {
    return this._env.REDIS_HOST ?? 'localhost';
  }

  get redisPort(): number {
    return parseInt(this._env.REDIS_PORT ?? '6379', 10);
  }

  get redisPassword(): string | undefined {
    return this._env.REDIS_PASSWORD;
  }

  get redisDb(): number {
    return parseInt(this._env.REDIS_DB ?? '0', 10);
  }

  get redisUrl(): string | undefined {
    return this._env.REDIS_URL;
  }

  get cacheTtl(): number {
    return parseInt(this._env.CACHE_TTL ?? '300000', 10); // 5 minutes (300000ms) default
  }

  get cacheMax(): number {
    return parseInt(this._env.CACHE_MAX ?? '5000', 10); // 5000 items default (LRU size)
  }
}

/**
 * Convenience function for getting environment instance
 */
export const env = (): Environment => Environment.getInstance();

/**
 * Legacy compatibility functions (can be removed once migration is complete)
 */
export const requireEnv = (key: keyof AppEnvironmentVariables): string => {
  const value = env().all[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

export const isProd = (): boolean => env().isProduction;

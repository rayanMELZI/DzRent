/**
 * DzRent — Application Configuration
 *
 * All environment variables are validated at startup via Joi.
 * If any required variable is missing or malformed, the app refuses to start.
 * This catches misconfigured deployments before they cause runtime failures.
 */

export interface AppConfig {
  // ── App ─────────────────────────────────────────────────────────────────
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
  APP_PORT: number;
  APP_SECRET: string;
  CORS_ORIGINS: string;

  // ── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: string;
  DIRECT_URL: string;

  // ── JWT ──────────────────────────────────────────────────────────────────
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // ── Redis (OTP store, job queues, refresh-token revocation) ──────────────
  REDIS_URL: string;

  // ── Twilio SMS ────────────────────────────────────────────────────────────
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;

  // ── Object Storage (S3-compatible) ───────────────────────────────────────
  S3_ENDPOINT: string;
  S3_REGION: string;
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
  S3_BUCKET_KYC: string;
  S3_BUCKET_VEHICLES: string;
  S3_BUCKET_CONTRACTS: string;
}

/**
 * Factory function consumed by ConfigModule.forRoot({ load: [configuration] }).
 * Maps process.env to typed AppConfig.
 */
export default (): AppConfig => ({
  NODE_ENV: (process.env.NODE_ENV as AppConfig['NODE_ENV']) ?? 'development',
  APP_PORT: parseInt(process.env.APP_PORT ?? '3000', 10),
  APP_SECRET: process.env.APP_SECRET!,
  CORS_ORIGINS: process.env.CORS_ORIGINS ?? 'http://localhost:3001',

  DATABASE_URL: process.env.DATABASE_URL!,
  DIRECT_URL: process.env.DIRECT_URL!,

  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',

  REDIS_URL: process.env.REDIS_URL!,

  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER!,

  S3_ENDPOINT: process.env.S3_ENDPOINT!,
  S3_REGION: process.env.S3_REGION ?? 'us-east-1',
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY!,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY!,
  S3_BUCKET_KYC: process.env.S3_BUCKET_KYC ?? 'dzrent-kyc',
  S3_BUCKET_VEHICLES: process.env.S3_BUCKET_VEHICLES ?? 'dzrent-vehicles',
  S3_BUCKET_CONTRACTS: process.env.S3_BUCKET_CONTRACTS ?? 'dzrent-contracts',
});

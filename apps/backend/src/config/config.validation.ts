import * as Joi from 'joi';

/**
 * Joi schema for environment variable validation.
 * The app will REFUSE to start if any required variable is absent or invalid.
 *
 * Imported by AppConfigModule and passed to ConfigModule.forRoot({ validationSchema }).
 */
export const configValidationSchema = Joi.object({
  // ── App ─────────────────────────────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  APP_PORT: Joi.number().integer().min(1024).max(65535).default(3000),
  APP_SECRET: Joi.string().min(32).required(),
  CORS_ORIGINS: Joi.string().default('http://localhost:3001'),

  // ── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  DIRECT_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  // ── JWT ──────────────────────────────────────────────────────────────────
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // ── Redis ─────────────────────────────────────────────────────────────────
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .required(),

  // ── Twilio ────────────────────────────────────────────────────────────────
  TWILIO_ACCOUNT_SID: Joi.string().pattern(/^AC/).required(),
  TWILIO_AUTH_TOKEN: Joi.string().length(32).required(),
  TWILIO_PHONE_NUMBER: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required(),

  // ── S3 ────────────────────────────────────────────────────────────────────
  S3_ENDPOINT: Joi.string().uri().required(),
  S3_REGION: Joi.string().default('us-east-1'),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET_KYC: Joi.string().default('dzrent-kyc'),
  S3_BUCKET_VEHICLES: Joi.string().default('dzrent-vehicles'),
  S3_BUCKET_CONTRACTS: Joi.string().default('dzrent-contracts'),
});

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './configuration';
import { configValidationSchema } from './config.validation';

/**
 * AppConfigModule wraps NestJS ConfigModule as a GLOBAL module.
 * Import this once in AppModule; all other modules get ConfigService injected
 * automatically without re-importing.
 *
 * Validation happens at process start: missing or malformed .env variables
 * throw immediately so misconfigured containers never come up half-broken.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,        // ConfigService available everywhere
      load: [configuration], // typed factory fn
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,  // don't error on extra env vars (CI injects many)
        abortEarly: false,   // report ALL validation errors at once
      },
      cache: true,           // micro-optimisation: parse env once, not per injection
    }),
  ],
})
export class AppConfigModule {}

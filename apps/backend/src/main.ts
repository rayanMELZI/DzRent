/**
 * DzRent — NestJS Application Bootstrap
 *
 * Conventions enforced globally:
 *  - All API routes prefixed with /api/v1
 *  - ValidationPipe: whitelist + forbidNonWhitelisted (never trust raw input)
 *  - Global exception filter: consistent error envelope across all modules
 *  - Helmet: basic HTTP security headers
 *  - CORS: locked to allowed origins from config
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const port = config.get<number>('APP_PORT', 3000);

  // ── Security headers ───────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS', 'http://localhost:3001').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Global validation pipe ────────────────────────────────────────────────
  // whitelist: strips unknown properties silently (DTO-defined props only)
  // forbidNonWhitelisted: throws 400 if unknown properties are sent
  // transform: auto-converts plain objects to class instances + primitive coercion
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global exception filter ───────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Swagger (dev + staging only) ─────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DzRent API')
      .setDescription('DzRent — Algerian Car Rental Platform · Client PWA + Agency SaaS')
      .setVersion('1.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'access-token',
      )
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'refresh-token',
      )
      .addTag('auth', 'Phone OTP authentication')
      .addTag('users', 'User profile management')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`📚 Swagger available at http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`🚀 DzRent API listening on port ${port} [${nodeEnv}]`);
}

bootstrap().catch((err: unknown) => {
  new Logger('Bootstrap').error('❌ Fatal startup error', err);
  process.exit(1);
});

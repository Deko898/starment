import 'dotenv/config';

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { env } from '@starment/config';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';

/**
 * Helper to parse CORS origins from env string
 */
function parseOrigins(list: string | undefined): string[] {
  const trimmed = (list ?? '').trim();
  if (!trimmed) {
    return [];
  }
  return trimmed
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // 🔹 Use our structured logger (pino)
  app.useLogger(app.get(Logger));

  // 🔹 Security headers
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                styleSrc: ["'self'", "'unsafe-inline'"], // needed by Swagger
                scriptSrc: ["'self'", "'unsafe-inline'"], // needed by Swagger
              },
            }
          : false, // disable CSP in dev
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // 🔹 CORS setup
  const origins = parseOrigins(process.env.CORS_ORIGINS);
  const allowAll = origins.length === 0 && process.env.NODE_ENV !== 'production';

  app.enableCors({
    origin: allowAll ? true : origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });

  // 🔹 Gzip compression
  app.use(compression());

  // 🔹 Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 🔹 API prefix + versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  // 🔹 Swagger setup (only if enabled in env)
  if (env().enableSwagger) {
    /**
     * Adds detailed OpenAPI metadata for better developer experience.
     * - Defines multiple server environments (local, production)
     * - Groups endpoints with tags for easier navigation
     * - Adds JWT Bearer authentication scheme
     */
    const config = new DocumentBuilder()
      .setTitle('Starment API')
      .setDescription('API for Starment platform (creators, fans, chats, etc.)')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
      .addServer('http://localhost:3000', 'Local environment')
      .addServer('https://api.starment.com', 'Production environment')
      .addTag('auth', 'Authentication endpoints')
      .addTag('profile', 'User profile management')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: true,
    });

    SwaggerModule.setup('/docs', app, document, {
      customSiteTitle: 'Starment API Docs',
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  // 🔹 Use structured logger for startup message
  const logger = app.get(Logger);
  logger.log(
    {
      service: env().serviceName,
      port,
      nodeEnv: env().nodeEnv,
      swaggerEnabled: env().enableSwagger,
    },
    `Application is listening on port ${port}`,
  );
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

import * as Sentry from '@sentry/node';

// Initialize Sentry before anything else
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
  });
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SentryExceptionFilter } from './sentry.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — только разрешённые источники
  app.enableCors({
    origin: [
      'http://45.94.158.17',
      'https://45.94.158.17',
      'http://ukusiruby.com',
      'https://ukusiruby.com',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Sentry exception filter (captures 5xx errors)
  if (process.env.SENTRY_DSN) {
    app.useGlobalFilters(new SentryExceptionFilter());
  }

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 UkusiRuby API запущен на порту ${port}`);
}
bootstrap();

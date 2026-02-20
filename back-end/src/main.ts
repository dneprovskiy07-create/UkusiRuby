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
      // Production server
      'http://45.94.158.17',
      'https://45.94.158.17',
      // Domain (when DNS is configured)
      'http://ukusiruby.com',
      'https://ukusiruby.com',
      'http://www.ukusiruby.com',
      'https://www.ukusiruby.com',
      // Capacitor mobile app origins
      'capacitor://localhost',
      'ionic://localhost',
      'http://localhost',
      // Dev (remove in final production)
      'http://localhost:5173',
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

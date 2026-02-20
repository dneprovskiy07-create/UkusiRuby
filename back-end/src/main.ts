import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — только разрешённые источники
  app.enableCors({
    origin: [
      'http://45.94.158.17',
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

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 UkusiRuby API запущен на порту ${port}`);
}
bootstrap();

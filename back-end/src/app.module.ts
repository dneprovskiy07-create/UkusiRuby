import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CatalogModule } from './catalog/catalog.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { PromocodeModule } from './promocode/promocode.module';
import { BannerModule } from './banner/banner.module';
import { UploadModule } from './upload/upload.module';
import { MailModule } from './mail/mail.module';
import { SettingsModule } from './settings/settings.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'ukusiruby',
      autoLoadEntities: true,
      synchronize: true, // Временно включено для создания таблиц. В продакшене лучше использовать миграции.
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    CatalogModule,
    OrdersModule,
    AuthModule,
    PromocodeModule,
    BannerModule,
    UploadModule,
    MailModule,
    NotificationsModule,
    SettingsModule,
  ],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { User } from '../entities/user.entity';
import { Address } from '../entities/address.entity';
import { City } from '../entities/city.entity';
import { Favorite } from '../entities/favorite.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Address, City, Favorite]),
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'dev_secret_key',
            signOptions: { expiresIn: '7d' },
        }),
        MailModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }

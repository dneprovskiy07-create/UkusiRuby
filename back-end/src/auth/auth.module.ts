import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Address } from '../entities/address.entity';
import { City } from '../entities/city.entity';
import { Favorite } from '../entities/favorite.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Address, City, Favorite]),
        MailModule,
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule { }

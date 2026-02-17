import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Address } from '../entities/address.entity';
import { Product } from '../entities/product.entity';
import { Promocode } from '../entities/promocode.entity';
import { City } from '../entities/city.entity';
import { User } from '../entities/user.entity';
import { Setting } from '../entities/setting.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, Address, Product, Promocode, City, User, Setting]),
        NotificationsModule
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }

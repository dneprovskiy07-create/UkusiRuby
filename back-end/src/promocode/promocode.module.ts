import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promocode } from '../entities/promocode.entity';
import { Order } from '../entities/order.entity';
import { PromocodeController } from './promocode.controller';
import { PromocodeService } from './promocode.service';

@Module({
    imports: [TypeOrmModule.forFeature([Promocode, Order])],
    controllers: [PromocodeController],
    providers: [PromocodeService],
})
export class PromocodeModule { }

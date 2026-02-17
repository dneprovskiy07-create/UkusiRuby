import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductOption } from '../entities/product-option.entity';
import { City } from '../entities/city.entity';
import { PickupPoint } from '../entities/pickup-point.entity';
import { Banner } from '../entities/banner.entity';
import { Promocode } from '../entities/promocode.entity';
import { Order } from '../entities/order.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Product, ProductOption, PickupPoint, Banner, Promocode, City, Order]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule { }

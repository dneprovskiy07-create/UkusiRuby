import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Address } from './address.entity';
import { PickupPoint } from './pickup-point.entity';
import { Category } from './category.entity';
import { Product } from './product.entity';
import { Banner } from './banner.entity';
import { Promocode } from './promocode.entity';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  delivery_fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  min_order_amount: number;

  @Column({ nullable: true })
  delivery_time: string;

  @Column({ nullable: true })
  support_phone: string;

  @Column({ nullable: true })
  working_hours: string;

  @Column({ nullable: true })
  work_start_time: string;

  @Column({ nullable: true })
  work_end_time: string;

  @Column('simple-array', { nullable: true })
  payment_methods: string[];

  @OneToMany(() => Address, (address) => address.city)
  addresses: Address[];

  @OneToMany(() => PickupPoint, (pp) => pp.city)
  pickup_points: PickupPoint[];

  @OneToMany(() => Category, (cat) => cat.city)
  categories: Category[];

  @OneToMany(() => Product, (product) => product.city)
  products: Product[];

  @OneToMany(() => Banner, (banner) => banner.city)
  banners: Banner[];

  @OneToMany(() => Promocode, (promo) => promo.city)
  promocodes: Promocode[];
}

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Address } from './address.entity';
import { OrderItem } from './order-item.entity';
import { City } from './city.entity';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.orders)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ nullable: true })
    user_id: string | null;

    @ManyToOne(() => Address)
    @JoinColumn({ name: 'address_id' })
    address: Address;

    @Column({ nullable: true })
    address_id: string;

    @Column({ type: 'text', nullable: true })
    address_text: string;

    @Column({ type: 'real', default: 0 })
    total_amount: number;

    @Column({ type: 'real', default: 0 })
    delivery_fee: number;

    @Column({ type: 'real', default: 0 })
    discount_amount: number;

    @Column({ type: 'real', default: 0 })
    final_amount: number;

    @Column({ type: 'real', default: 0 })
    cashback_used: number;

    @Column({ type: 'varchar', default: 'cash_on_delivery' })
    payment_method: string;

    @Column({ type: 'varchar', default: 'pending' })
    payment_status: string;

    @Column({ type: 'varchar', default: 'new' })
    order_status: string;

    @Column({ nullable: true })
    promo_code: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ type: 'text', nullable: true })
    courier_comment: string;

    @Column({ nullable: true })
    scheduled_time: Date;

    @Column({ type: 'integer', default: 1 })
    cutlery: number;

    @Column({ type: 'varchar', default: 'delivery' })
    order_type: 'delivery' | 'pickup';

    @Column({ nullable: true })
    pickup_point_id: string;

    @ManyToOne(() => City)
    @JoinColumn({ name: 'city_id' })
    city: City;

    @Column({ nullable: true })
    city_id: number;

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];
}

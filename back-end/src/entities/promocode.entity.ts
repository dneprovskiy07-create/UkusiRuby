import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';
import { City } from './city.entity';

@Entity('promocodes')
export class Promocode {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'varchar', default: 'percentage' })
    discount_type: string;

    @Column({ type: 'real', default: 0 })
    discount_value: number;

    @Column({ nullable: true })
    expires_at: Date;

    @Column({ default: 1 })
    usage_limit: number;

    @Column({ default: 0 })
    usage_count: number;

    @ManyToOne(() => User, (user) => user.promocodes, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ nullable: true })
    user_id: string;

    @Column({ type: 'real', default: 0 })
    min_order_amount: number;

    @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'gift_product_id' })
    gift_product: Product;

    @Column({ nullable: true })
    gift_product_id: string;

    @Column({ type: 'real', nullable: true })
    gift_price: number;

    @ManyToOne(() => City, { nullable: true })
    @JoinColumn({ name: 'city_id' })
    city: City;

    @Column({ nullable: true })
    city_id: number;

    @Column({ default: false })
    is_visible: boolean;
}

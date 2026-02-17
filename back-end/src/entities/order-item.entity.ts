import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column()
    order_id: string;

    @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ nullable: true })
    product_id: string;

    @Column({ default: 1 })
    quantity: number;

    @Column({ type: 'real' })
    price_at_purchase: number;

    @Column({ type: 'simple-json', nullable: true })
    selected_options: any;
}

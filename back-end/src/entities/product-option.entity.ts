import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_options')
export class ProductOption {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Product, (product) => product.options, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column()
    product_id: string;

    @Column()
    name: string;

    @Column({ type: 'real', default: 0 })
    additional_price: number;

    @Column({ default: false })
    is_required: boolean;
}

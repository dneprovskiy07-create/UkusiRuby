import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { ProductOption } from './product-option.entity';
import { City } from './city.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Category, (cat) => cat.products)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column()
    category_id: number;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'real' })
    price: number;

    @Column({ nullable: true })
    image_url: string;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: false })
    is_hit: boolean;

    @Column({ default: false })
    is_new: boolean;

    @Column({ default: false })
    is_promo: boolean;

    @Column({ default: 0 })
    sort_order: number;

    @OneToMany(() => ProductOption, (opt) => opt.product)
    options: ProductOption[];

    @ManyToOne(() => City, { nullable: true })
    @JoinColumn({ name: 'city_id' })
    city: City;

    @Column({ nullable: true })
    city_id: number;
}

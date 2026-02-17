import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { City } from './city.entity';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    icon: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    image_url: string;

    @Column({ default: 0 })
    sort_order: number;

    @Column({ default: true })
    is_active: boolean;

    @OneToMany(() => Product, (product) => product.category)
    products: Product[];

    @ManyToOne(() => City, { nullable: true })
    @JoinColumn({ name: 'city_id' })
    city: City;

    @Column({ nullable: true })
    city_id: number;
}

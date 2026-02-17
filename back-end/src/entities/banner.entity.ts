import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { City } from './city.entity';

@Entity('banners')
export class Banner {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column()
    image_url: string;

    @Column({ nullable: true })
    link: string;

    @Column({ default: 0 })
    sort_order: number;

    @Column({ default: true })
    is_active: boolean;

    @ManyToOne(() => City, { nullable: true })
    @JoinColumn({ name: 'city_id' })
    city: City;

    @Column({ nullable: true })
    city_id: number;
}

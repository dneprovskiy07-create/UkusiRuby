import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { City } from './city.entity';

@Entity('pickup_points')
export class PickupPoint {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    address: string;

    @ManyToOne(() => City, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'city_id' })
    city: City;

    @Column()
    city_id: number;
}

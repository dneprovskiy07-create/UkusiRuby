import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { City } from './city.entity';

@Entity('addresses')
export class Address {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    user_id: string;

    @ManyToOne(() => City, (city) => city.addresses)
    @JoinColumn({ name: 'city_id' })
    city: City;

    @Column()
    city_id: number;

    @Column()
    street: string;

    @Column({ nullable: true })
    building: string;

    @Column({ nullable: true })
    apartment: string;

    @Column({ nullable: true })
    floor: string;

    @Column({ nullable: true })
    entrance: string;

    @Column({ nullable: true })
    comment: string;

    @Column({ type: 'float', nullable: true })
    lat: number;

    @Column({ type: 'float', nullable: true })
    lng: number;
}

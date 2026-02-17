import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { Address } from './address.entity';
import { Order } from './order.entity';
import { Favorite } from './favorite.entity';
import { Promocode } from './promocode.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true, select: false }) // select: false to not return password by default
    password: string;

    @Column({ nullable: true, select: false })
    reset_token: string;

    @Column({ nullable: true, type: 'datetime' })
    reset_token_expires: Date;

    @Column({ default: true })
    push_enabled: boolean;

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => Address, (address) => address.user)
    addresses: Address[];

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];

    @OneToMany(() => Favorite, (fav) => fav.user)
    favorites: Favorite[];

    @OneToMany(() => Promocode, (promo) => promo.user)
    promocodes: Promocode[];

    @Column({ type: 'real', default: 0 })
    cashback_balance: number;
}

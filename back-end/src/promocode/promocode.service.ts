import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promocode } from '../entities/promocode.entity';
import { Order } from '../entities/order.entity';

@Injectable()
export class PromocodeService {
    constructor(
        @InjectRepository(Promocode)
        private readonly promoRepo: Repository<Promocode>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
    ) { }

    async getAll(cityId?: number) {
        const where: any = {};
        if (cityId) where.city_id = cityId;
        return this.promoRepo.find({
            where,
            order: { expires_at: 'DESC' },
            relations: ['gift_product']
        });
    }

    async getUserPromocodes(userId: string) {
        return this.promoRepo.find({ where: { user_id: userId } });
    }

    async create(data: Partial<Promocode>) {
        if (data.usage_limit === undefined || data.usage_limit === 0) data.usage_limit = 1000000;
        const promo = this.promoRepo.create(data);
        const saved = await this.promoRepo.save(promo);
        return this.promoRepo.findOne({ where: { id: saved.id }, relations: ['gift_product'] });
    }

    async validate(code: string, cityId?: number) {
        const where: any = { code };
        if (cityId) where.city_id = cityId;

        const promo = await this.promoRepo.findOne({
            where,
            relations: ['gift_product']
        });
        if (!promo) return { valid: false, message: 'Промокод не найден' };
        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
            return { valid: false, message: 'Промокод просрочен' };
        }
        // if (promo.usage_count >= promo.usage_limit) {
        //     return { valid: false, message: 'Лимит использования исчерпан' };
        // }
        return { valid: true, promo };
    }

    async delete(id: string) {
        return this.promoRepo.delete(id);
    }

    async getVisible(cityId?: number, userId?: string) {
        const qb = this.promoRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.gift_product', 'gift')
            .where('p.is_visible = :visible', { visible: true })
            .andWhere('(p.expires_at IS NULL OR p.expires_at > :now)', { now: new Date() })
            .andWhere('p.usage_count < p.usage_limit');

        if (cityId) {
            qb.andWhere('(p.city_id IS NULL OR p.city_id = :cityId)', { cityId });
        }

        const promos = await qb.getMany();

        if (userId && userId !== 'guest') {
            const result: Promocode[] = [];
            for (const p of promos) {
                const used = await this.orderRepo.findOne({
                    where: { user_id: userId, promo_code: p.code }
                });
                if (!used) result.push(p);
            }
            return result;
        }

        return promos;
    }
}

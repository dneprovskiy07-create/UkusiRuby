import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from '../entities/banner.entity';

@Injectable()
export class BannerService {
    constructor(
        @InjectRepository(Banner)
        private readonly bannerRepo: Repository<Banner>,
    ) { }

    async getActive(cityId?: number) {
        const where: any = { is_active: true };
        if (cityId) where.city_id = cityId;
        return this.bannerRepo.find({
            where,
            order: { sort_order: 'ASC' },
        });
    }

    async getAll(cityId?: number) {
        const where: any = {};
        if (cityId) where.city_id = cityId;
        return this.bannerRepo.find({
            where,
            order: { sort_order: 'ASC' }
        });
    }

    async create(data: Partial<Banner>) {
        const banner = this.bannerRepo.create(data);
        return this.bannerRepo.save(banner);
    }

    async update(id: number, data: Partial<Banner>) {
        await this.bannerRepo.update(id, data);
        return this.bannerRepo.findOneBy({ id });
    }

    async delete(id: number) {
        return this.bannerRepo.delete(id);
    }
}

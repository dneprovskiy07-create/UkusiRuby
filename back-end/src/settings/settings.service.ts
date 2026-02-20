import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';
import { City } from '../entities/city.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
    constructor(
        @InjectRepository(Setting)
        private readonly settingRepo: Repository<Setting>,
        @InjectRepository(City)
        private readonly cityRepo: Repository<City>,
    ) { }

    async onModuleInit() {
        try {
            // Ensure default settings exist
            const defaults = [
                { key: 'delivery_fee', value: '50', description: 'Стоимость доставки (₴)' },
                { key: 'min_order_amount', value: '200', description: 'Минимальная сумма заказа (₴)' },
                { key: 'delivery_time', value: '30–50 минут', description: 'Время доставки' },
                { key: 'support_phone', value: '+380 44 123 45 67', description: 'Телефон поддержки' },
                { key: 'loyalty_enabled', value: 'false', description: 'Включена ли программа лояльности' },
                { key: 'cashback_percent', value: '5', description: 'Процент кэшбэка' },
                { key: 'max_cashback_use_percent', value: '50', description: 'Макс. % оплаты бонусами' },
            ];

            for (const d of defaults) {
                const exists = await this.settingRepo.findOneBy({ key: d.key });
                if (!exists) {
                    await this.settingRepo.save(this.settingRepo.create(d));
                }
            }
        } catch (error) {
            console.warn('[SettingsService] Could not seed defaults (table may not exist yet):', error.message);
        }
    }

    async getSettings() {
        const arr = await this.settingRepo.find();
        return arr.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }

    async updateSetting(key: string, value: string) {
        await this.settingRepo.save({ key, value });
        return this.settingRepo.findOneBy({ key });
    }

    async getCities() {
        return this.cityRepo.find({ order: { sort_order: 'ASC' } });
    }

    async createCity(data: Partial<City>) {
        const city = this.cityRepo.create(data);
        return this.cityRepo.save(city);
    }

    async updateCity(id: number, data: Partial<City>) {
        await this.cityRepo.update(id, data);
        return this.cityRepo.findOneBy({ id });
    }

    async deleteCity(id: number) {
        return this.cityRepo.delete(id);
    }
}

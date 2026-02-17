import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull, Not } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { PickupPoint } from '../entities/pickup-point.entity';
import { Banner } from '../entities/banner.entity';
import { Promocode } from '../entities/promocode.entity';
import { City } from '../entities/city.entity';
import { Order } from '../entities/order.entity';

@Injectable()
export class CatalogService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(PickupPoint)
        private readonly pickupRepo: Repository<PickupPoint>,
        @InjectRepository(Banner)
        private readonly bannerRepo: Repository<Banner>,
        @InjectRepository(Promocode)
        private readonly promoRepo: Repository<Promocode>,
        @InjectRepository(City)
        private readonly cityRepo: Repository<City>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
    ) { }

    // ── Категории ──
    async getCategories(cityId?: number) {
        let qb = this.categoryRepo.createQueryBuilder('category')
            .where('category.is_active = :active', { active: true });

        if (cityId) {
            qb.andWhere('category.city_id = :cityId', { cityId });
        }

        // Optional: Count active products for public API
        // qb.loadRelationCountAndMap('category.productsCount', 'category.products', 'p', (qb) => qb.where('p.is_active = :active', { active: true }));

        return qb.orderBy('category.sort_order', 'ASC').addOrderBy('category.id', 'ASC').getMany();
    }

    // ── Точки самовывоза ──
    async getPickupPoints(cityId: number) {
        return this.pickupRepo.find({ where: { city_id: cityId } });
    }

    async createPickupPoint(data: Partial<PickupPoint>) {
        const pp = this.pickupRepo.create(data);
        return this.pickupRepo.save(pp);
    }

    async updatePickupPoint(id: string, data: Partial<PickupPoint>) {
        await this.pickupRepo.update(id, data);
        return this.pickupRepo.findOneBy({ id });
    }

    async deletePickupPoint(id: string) {
        return this.pickupRepo.delete(id);
    }

    async getAllCategories(cityId?: number) {
        let qb = this.categoryRepo.createQueryBuilder('category');

        if (cityId) {
            qb.where('category.city_id = :cityId', { cityId });
        }

        qb.loadRelationCountAndMap('category.productsCount', 'category.products');

        return qb.orderBy('category.sort_order', 'ASC').addOrderBy('category.id', 'ASC').getMany();
    }

    async getCategoryById(id: number) {
        return this.categoryRepo.findOne({ where: { id }, relations: ['products'] });
    }

    async createCategory(data: Partial<Category>) {
        const cat = this.categoryRepo.create(data);
        return this.categoryRepo.save(cat);
    }

    async updateCategory(id: number, data: Partial<Category>) {
        await this.categoryRepo.update(id, data);
        return this.categoryRepo.findOneBy({ id });
    }

    async deleteCategory(id: number) {
        return this.categoryRepo.delete(id);
    }

    async reorderCategory(id: number, direction: 'up' | 'down') {
        const cat = await this.categoryRepo.findOne({ where: { id } });
        if (!cat) throw new BadRequestException('Category not found');

        const all = await this.categoryRepo.find({
            where: { city_id: cat.city_id },
            order: { sort_order: 'ASC', id: 'ASC' }
        });

        const idx = all.findIndex(c => c.id === id);
        if (idx === -1) return;

        let targetIdx = -1;
        if (direction === 'up' && idx > 0) targetIdx = idx - 1;
        if (direction === 'down' && idx < all.length - 1) targetIdx = idx + 1;

        if (targetIdx !== -1) {
            const target = all[targetIdx];
            // Swap sort_order
            const temp = cat.sort_order;
            // If they are equal (e.g. both 0), we need to force unique values
            if (cat.sort_order === target.sort_order) {
                // Re-index all to be sure
                for (let i = 0; i < all.length; i++) {
                    all[i].sort_order = i;
                }
                const newIdx = all.findIndex(c => c.id === id);
                const newTargetIdx = direction === 'up' ? newIdx - 1 : newIdx + 1;

                const temp2 = all[newIdx].sort_order;
                all[newIdx].sort_order = all[newTargetIdx].sort_order;
                all[newTargetIdx].sort_order = temp2;

                await this.categoryRepo.save(all);
            } else {
                cat.sort_order = target.sort_order;
                target.sort_order = temp;
                await this.categoryRepo.save([cat, target]);
            }
        }
    }

    // ── Товары ──
    async getProducts(categoryId?: number, sort?: string, cityId?: number) {
        const qb = this.productRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.options', 'opt')
            .leftJoinAndSelect('p.category', 'cat')
            .where('p.is_active = :active', { active: true });

        if (cityId) {
            qb.andWhere('p.city_id = :cityId', { cityId });
        }

        if (categoryId) {
            qb.andWhere('p.category_id = :catId', { catId: categoryId });
        }

        if (sort === 'price_asc') qb.orderBy('p.price', 'ASC');
        else if (sort === 'price_desc') qb.orderBy('p.price', 'DESC');
        else qb.orderBy('cat.sort_order', 'ASC').addOrderBy('p.sort_order', 'ASC').addOrderBy('p.id', 'ASC');

        return qb.getMany();
    }

    async getAllProducts(cityId?: number) {
        const where: any = {};
        if (cityId) where.city_id = cityId;
        return this.productRepo.find({
            where,
            relations: ['category', 'options'],
            order: { category: { sort_order: 'ASC' }, sort_order: 'ASC', id: 'ASC' } as any,
        });
    }

    async getProductById(id: string) {
        return this.productRepo.findOne({
            where: { id },
            relations: ['options', 'category'],
        });
    }

    async createProduct(data: Partial<Product>) {
        const product = this.productRepo.create(data);
        return this.productRepo.save(product);
    }

    async updateProduct(id: string, data: Partial<Product>) {
        await this.productRepo.update(id, data);
        return this.getProductById(id);
    }

    async deleteProduct(id: string) {
        return this.productRepo.delete(id);
    }

    async reorderProduct(id: string, direction: 'up' | 'down') {
        const prod = await this.productRepo.findOne({ where: { id } });
        if (!prod) throw new BadRequestException('Product not found');

        const all = await this.productRepo.find({
            where: { city_id: prod.city_id, category_id: prod.category_id },
            order: { sort_order: 'ASC', id: 'ASC' }
        });

        const idx = all.findIndex(p => p.id === id);
        if (idx === -1) return;

        let targetIdx = -1;
        if (direction === 'up' && idx > 0) targetIdx = idx - 1;
        if (direction === 'down' && idx < all.length - 1) targetIdx = idx + 1;

        if (targetIdx !== -1) {
            const target = all[targetIdx];
            const temp = prod.sort_order;

            if (prod.sort_order === target.sort_order) {
                for (let i = 0; i < all.length; i++) {
                    all[i].sort_order = i;
                }
                const newIdx = all.findIndex(p => p.id === id);
                const newTargetIdx = direction === 'up' ? newIdx - 1 : newIdx + 1;

                const temp2 = all[newIdx].sort_order;
                all[newIdx].sort_order = all[newTargetIdx].sort_order;
                all[newTargetIdx].sort_order = temp2;

                await this.productRepo.save(all);
            } else {
                prod.sort_order = target.sort_order;
                target.sort_order = temp;
                await this.productRepo.save([prod, target]);
            }
        }
    }

    async searchProducts(query: string, cityId?: number) {
        const qb = this.productRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.category', 'cat')
            .where('p.is_active = true')
            .andWhere('(LOWER(p.name) LIKE :q OR LOWER(p.description) LIKE :q)', {
                q: `%${query.toLowerCase()}%`,
            });

        if (cityId) {
            qb.andWhere('p.city_id = :cityId', { cityId });
        }

        return qb.orderBy('p.sort_order', 'ASC').getMany();
    }

    async syncCityMenu(fromCityId: number, toCityId: number, syncSettings = false) {
        // Clear target city data first (Categories, Products, Banners, Promos)
        await this.productRepo.delete({ city_id: toCityId });
        await this.categoryRepo.delete({ city_id: toCityId });
        await this.bannerRepo.delete({ city_id: toCityId });
        await this.promoRepo.delete({ city_id: toCityId });

        const categories = await this.categoryRepo.find({ where: { city_id: fromCityId } });
        const products = await this.productRepo.find({ where: { city_id: fromCityId }, relations: ['options'] });
        const banners = await this.bannerRepo.find({ where: { city_id: fromCityId } });
        const promocodes = await this.promoRepo.find({ where: { city_id: fromCityId } });

        // Map old category IDs to new category IDs
        const catMap = new Map<number, number>();

        for (const cat of categories) {
            const { id, ...rest } = cat;
            const newCat = await this.categoryRepo.save(this.categoryRepo.create({ ...rest, city_id: toCityId }));
            catMap.set(id, newCat.id);
        }

        for (const prod of products) {
            const { id, options, ...rest } = prod;
            const newProd = this.productRepo.create({
                ...rest,
                city_id: toCityId,
                category_id: catMap.get(prod.category_id),
            });
            const savedProd = await this.productRepo.save(newProd);

            if (options && options.length > 0) {
                for (const opt of options) {
                    const { id: optId, ...optRest } = opt;
                    await this.productRepo.manager.save('ProductOption', {
                        ...optRest,
                        product_id: savedProd.id
                    });
                }
            }
        }

        for (const banner of banners) {
            const { id, ...rest } = banner;
            await this.bannerRepo.save(this.bannerRepo.create({ ...rest, city_id: toCityId }));
        }

        for (const promo of promocodes) {
            const { id, ...rest } = promo;
            await this.promoRepo.save(this.promoRepo.create({ ...rest, city_id: toCityId }));
        }

        if (syncSettings) {
            const fromCity = await this.cityRepo.findOne({ where: { id: fromCityId } });
            const toCity = await this.cityRepo.findOne({ where: { id: toCityId } });
            if (fromCity && toCity) {
                toCity.delivery_fee = fromCity.delivery_fee;
                toCity.min_order_amount = fromCity.min_order_amount;
                toCity.delivery_time = fromCity.delivery_time;
                toCity.support_phone = fromCity.support_phone;
                toCity.working_hours = fromCity.working_hours;
                await this.cityRepo.save(toCity);
            }
        }

        return { success: true };
    }

    async syncAllCities() {
        const firstCity = await this.cityRepo.findOne({ where: {}, order: { sort_order: 'ASC' } });
        if (!firstCity) return { success: false, message: 'Source city not found' };

        const otherCities = await this.cityRepo.find({ where: { id: Not(firstCity.id) } });

        for (const targetCity of otherCities) {
            await this.syncCityMenu(firstCity.id, targetCity.id, true);
        }

        return { success: true, count: otherCities.length };
    }

    async migrateExistingData() {
        try {
            const firstCity = await this.cityRepo.findOne({ where: {}, order: { sort_order: 'ASC' } });
            if (!firstCity) return { success: false, message: 'Сначала создайте хотя бы один город' };

            console.log(`[Migration] Starting migration to city: ${firstCity.name} (ID: ${firstCity.id})`);

            // Update with individual try-catch to identify failing table
            try { await this.categoryRepo.createQueryBuilder().update().set({ city_id: firstCity.id }).where('city_id IS NULL').execute(); } catch (e) { console.error('Migration fail: Category', e.message); }
            try { await this.productRepo.createQueryBuilder().update().set({ city_id: firstCity.id }).where('city_id IS NULL').execute(); } catch (e) { console.error('Migration fail: Product', e.message); }
            try { await this.bannerRepo.createQueryBuilder().update().set({ city_id: firstCity.id }).where('city_id IS NULL').execute(); } catch (e) { console.error('Migration fail: Banner', e.message); }
            try { await this.promoRepo.createQueryBuilder().update().set({ city_id: firstCity.id }).where('city_id IS NULL').execute(); } catch (e) { console.error('Migration fail: Promo', e.message); }

            return { success: true, city: firstCity.name };
        } catch (error) {
            console.error('[Migration] Critical fail:', error);
            throw error;
        }
    }
}

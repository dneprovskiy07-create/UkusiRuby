import { DataSource } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Banner } from './entities/banner.entity';
import { Promocode } from './entities/promocode.entity';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { City } from './entities/city.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Favorite } from './entities/favorite.entity';
import { ProductOption } from './entities/product-option.entity';

async function seed() {
    const ds = new DataSource({
        type: 'better-sqlite3',
        database: 'ukusiruby.db',
        entities: [Category, Product, Banner, Promocode, User, Address, City, Order, OrderItem, Favorite, ProductOption],
        synchronize: true,
    });

    await ds.initialize();
    console.log('💾  Connected to DB');

    const catRepo = ds.getRepository(Category);
    const prodRepo = ds.getRepository(Product);
    const bannerRepo = ds.getRepository(Banner);
    const promoRepo = ds.getRepository(Promocode);

    // ── Очистка ──
    await ds.query('PRAGMA foreign_keys = OFF;');
    await ds.createQueryBuilder().delete().from(Product).execute();
    await ds.createQueryBuilder().delete().from(Category).execute();
    await ds.createQueryBuilder().delete().from(Banner).execute();
    await ds.createQueryBuilder().delete().from(Promocode).execute();
    await ds.query('PRAGMA foreign_keys = ON;');
    console.log('🗑️  Cleared old data');

    // ── Категории ──
    const categories = await catRepo.save([
        { name: 'Роллы', icon: '🍣', description: 'Классические и фирменные роллы', sort_order: 1, is_active: true },
        { name: 'Суши', icon: '🍱', description: 'Нигири, гунканы и сеты', sort_order: 2, is_active: true },
        { name: 'Сеты', icon: '🎁', description: 'Выгодные наборы для компании', sort_order: 3, is_active: true },
        { name: 'Напитки', icon: '🥤', description: 'Лимонады, соки и чай', sort_order: 4, is_active: true },
        { name: 'Десерты', icon: '🍰', description: 'Моти, чизкейки и тирамису', sort_order: 5, is_active: true },
        { name: 'Горячее', icon: '🍜', description: 'Рамен, удон и тёплые блюда', sort_order: 6, is_active: true },
    ]);
    console.log(`✅ ${categories.length} categories created`);

    const [rolls, sushi, sets, drinks, desserts, hot] = categories;

    // ── Товары ──
    const products = await prodRepo.save([
        // Роллы
        { name: 'Филадельфия Классик', description: 'Лосось, сливочный сыр, рис, нори. 8 шт / 280 г', price: 399, category_id: rolls.id, is_active: true, is_hit: true, sort_order: 1, image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=600&fit=crop' },
        { name: 'Калифорния', description: 'Краб, авокадо, огурец, икра масаго. 8 шт / 260 г', price: 359, category_id: rolls.id, is_active: true, sort_order: 2, image_url: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=600&fit=crop' },
        { name: 'Дракон', description: 'Угорь, авокадо, огурец, унаги соус. 8 шт / 300 г', price: 449, category_id: rolls.id, is_active: true, is_new: true, sort_order: 3, image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600&h=600&fit=crop' },
        { name: 'Спайси Лосось', description: 'Острый лосось, огурец, спайси соус. 8 шт / 250 г', price: 329, category_id: rolls.id, is_active: true, sort_order: 4, image_url: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=600&h=600&fit=crop' },
        { name: 'Темпура', description: 'Креветка в темпуре, авокадо, сливочный сыр. 8 шт / 290 г', price: 419, category_id: rolls.id, is_active: true, sort_order: 5, image_url: 'https://images.unsplash.com/photo-1562158074-06103446059e?w=600&h=600&fit=crop' },
        { name: 'Вулкан', description: 'Запечённый ролл с лососем и острым майонезом. 8 шт / 310 г', price: 389, category_id: rolls.id, is_active: true, is_promo: true, sort_order: 6, image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=600&fit=crop' },

        // Суши
        { name: 'Нигири Лосось (2 шт)', description: 'Свежий лосось на прессованном рисе', price: 179, category_id: sushi.id, is_active: true, sort_order: 1, image_url: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&h=600&fit=crop' },
        { name: 'Нигири Тунец (2 шт)', description: 'Тунец на рисовой подушке', price: 199, category_id: sushi.id, is_active: true, sort_order: 2, image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=600&fit=crop' },
        { name: 'Гункан Икра', description: 'Рис обёрнутый в нори с красной икрой', price: 249, category_id: sushi.id, is_active: true, is_hit: true, sort_order: 3, image_url: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=600&h=600&fit=crop' },
        { name: 'Нигири Угорь (2 шт)', description: 'Копчёный угорь с соусом унаги', price: 229, category_id: sushi.id, is_active: true, sort_order: 4, image_url: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=600&h=600&fit=crop' },

        // Сеты
        { name: 'Сет «Для двоих»', description: 'Филадельфия (8 шт) + Калифорния (8 шт) + Нигири (4 шт). 900 г', price: 899, category_id: sets.id, is_active: true, is_hit: true, sort_order: 1, image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1000&h=1000&fit=crop' },
        { name: 'Сет «Party»', description: 'Филадельфия + Дракон + Спайси + Темпура. 40 шт / 1200 г', price: 1499, category_id: sets.id, is_active: true, is_new: true, sort_order: 2, image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1000&h=1000&fit=crop' },

        // Напитки
        { name: 'Лимонад Манго-Маракуйя', description: '450 мл', price: 149, category_id: drinks.id, is_active: true, sort_order: 1, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&h=600&fit=crop' },
        { name: 'Зелёный чай', description: 'Горячий японский зелёный чай. 300 мл', price: 99, category_id: drinks.id, is_active: true, sort_order: 2, image_url: 'https://images.unsplash.com/photo-1594631252845-29fc458631b6?w=600&h=600&fit=crop' },
        { name: 'Кока-Кола', description: '500 мл', price: 89, category_id: drinks.id, is_active: true, sort_order: 3, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=600&fit=crop' },

        // Десерты
        { name: 'Моти Манго (3 шт)', description: 'Японское мороженое в рисовом тесте', price: 249, category_id: desserts.id, is_active: true, is_new: true, sort_order: 1, image_url: 'https://images.unsplash.com/photo-1564834744159-ff0ea41ba4b9?w=600&h=600&fit=crop' },
        { name: 'Чизкейк', description: 'Классический чизкейк. 120 г', price: 199, category_id: desserts.id, is_active: true, sort_order: 2, image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&h=600&fit=crop' },

        // Горячее
        { name: 'Рамен Тонкоцу', description: 'Наваристый свиной бульон, яйцо, чаасю, нори. 500 мл', price: 359, category_id: hot.id, is_active: true, is_hit: true, sort_order: 1, image_url: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600&h=600&fit=crop' },
        { name: 'Удон с курицей', description: 'Толстая лапша с курицей и овощами в соусе терияки. 400 г', price: 289, category_id: hot.id, is_active: true, sort_order: 2, image_url: 'https://images.unsplash.com/photo-1543826173-7fa1486d3112?w=600&h=600&fit=crop' },
    ]);
    console.log(`✅ ${products.length} products created`);

    // ── Баннеры ──
    const banners = await bannerRepo.save([
        { image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=300&fit=crop', link_type: 'category', link_id: String(rolls.id), sort_order: 1, is_active: true },
        { image_url: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=800&h=300&fit=crop', link_type: 'category', link_id: String(sets.id), sort_order: 2, is_active: true },
        { image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&h=300&fit=crop', link_type: 'category', link_id: String(hot.id), sort_order: 3, is_active: true },
    ]);
    console.log(`✅ ${banners.length} banners created`);

    // ── Промокоды ──
    const promos = await promoRepo.save([
        { code: 'WELCOME10', description: 'Скидка 10% на первый заказ', discount_type: 'percentage', discount_value: 10, expires_at: new Date('2026-12-31'), usage_limit: 100, usage_count: 0 },
        { code: 'FISH50', description: 'Скидка 50 грн на заказы от 500 грн', discount_type: 'fixed', discount_value: 50, expires_at: new Date('2026-06-30'), usage_limit: 50, usage_count: 0 },
        { code: 'QWE', description: 'Подарочный ролл за заказ от 1000 грн', discount_type: 'gift', discount_value: 0, gift_product_id: (products as any[]).find(p => p.name === 'Вулкан')?.id, gift_price: 10, min_order_amount: 1000, expires_at: new Date('2026-12-31'), usage_limit: 100, usage_count: 0 },
    ]);
    console.log(`✅ ${promos.length} promocodes created`);

    // ── Настройки ──
    const settingRepo = ds.getRepository(require('./entities/setting.entity').Setting);
    await settingRepo.save([
        { key: 'delivery_fee', value: '50', description: 'Стоимость доставки (по умолчанию)' },
        { key: 'min_order_amount', value: '300', description: 'Минимальная сумма заказа' },
        { key: 'loyalty_enabled', value: 'true', description: 'Включена ли программа лояльности' },
        { key: 'cashback_percent', value: '5', description: 'Процент кэшбэка' },
        { key: 'max_cashback_use_percent', value: '50', description: 'Максимальный процент списания баллов' },
    ]);
    console.log(`✅ Settings created`);

    console.log('\n🎉 Seed complete!');
    await ds.destroy();
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});

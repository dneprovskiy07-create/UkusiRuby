import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { Promocode } from '../entities/promocode.entity';
import { Address } from '../entities/address.entity';
import { City } from '../entities/city.entity';
import { User } from '../entities/user.entity';
import { Setting } from '../entities/setting.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly itemRepo: Repository<OrderItem>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(Promocode)
        private readonly promoRepo: Repository<Promocode>,
        @InjectRepository(City)
        private readonly cityRepo: Repository<City>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Setting)
        private readonly settingRepo: Repository<Setting>,
        @InjectRepository(Address)
        private readonly addressRepo: Repository<Address>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async getAllOrders(cityId?: number) {
        const where: any = {};
        if (cityId) where.city_id = cityId;

        return this.orderRepo.find({
            where,
            relations: ['items', 'items.product'],
            order: { created_at: 'DESC' },
        });
    }

    async createOrder(dto: {
        user_id: string;
        address_id?: string;
        address_text?: string;
        phone?: string;
        courier_comment?: string;
        payment_method?: string;
        scheduled_time?: string;
        promo_code?: string;
        cutlery?: number;
        items: Array<{
            product_id: string;
            quantity: number;
            selected_options?: any;
        }>;
        city_id?: number;
        use_cashback?: boolean;
        order_type?: 'delivery' | 'pickup';
        pickup_point_id?: string;
    }) {
        // 1. Рассчитать сумму товаров
        let totalAmount = 0;
        const orderItems: Array<{
            product_id: string;
            quantity: number;
            price_at_purchase: number;
            selected_options: any;
        }> = [];

        for (const item of dto.items) {
            const product = await this.productRepo.findOneBy({ id: item.product_id });
            if (!product) throw new BadRequestException(`Товар ${item.product_id} не найден`);

            const lineTotal = Number(product.price) * item.quantity;
            totalAmount += lineTotal;

            orderItems.push({
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_purchase: Number(product.price),
                selected_options: item.selected_options || null,
            });
        }

        // 2. Применить промокод
        let discountAmount = 0;
        let giftItem: any = null;

        if (dto.promo_code) {
            const promo = await this.promoRepo.findOneBy({ code: dto.promo_code });
            if (!promo) throw new BadRequestException('Промокод не найден');
            if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
                throw new BadRequestException('Промокод просрочен');
            }
            if (promo.usage_count >= promo.usage_limit) {
                throw new BadRequestException('Промокод использован максимальное кол-во раз');
            }
            if (promo.min_order_amount && totalAmount < Number(promo.min_order_amount)) {
                throw new BadRequestException(`Минимальная сумма заказа для этого промокода — ${promo.min_order_amount}₴`);
            }

            if (promo.discount_type === 'percentage') {
                discountAmount = totalAmount * (Number(promo.discount_value) / 100);
            } else if (promo.discount_type === 'fixed') {
                discountAmount = Number(promo.discount_value);
            } else if (promo.discount_type === 'gift' && promo.gift_product_id) {
                const gp = await this.productRepo.findOneBy({ id: promo.gift_product_id });
                if (gp) {
                    giftItem = {
                        product_id: gp.id,
                        quantity: 1,
                        price_at_purchase: Number(promo.gift_price || 0),
                        selected_options: null
                    };
                }
            }

            await this.promoRepo.update(promo.id, { usage_count: promo.usage_count + 1 });
        }

        if (giftItem) {
            orderItems.push(giftItem);
            // We don't add gift price to totalAmount for min_order check, 
            // but it should probably be in the final amount? 
            // Usually gift is "for 5₴", so it adds 5₴ to total.
            totalAmount += giftItem.price_at_purchase;
        }

        let deliveryFee = 50; // default fallout
        if (dto.order_type === 'pickup') {
            deliveryFee = 0;
        } else if (dto.city_id) {
            const city = await this.cityRepo.findOneBy({ id: dto.city_id });
            if (city) {
                if (totalAmount < Number(city.min_order_amount)) {
                    throw new BadRequestException(`Минимальная сумма заказа для города ${city.name} — ${city.min_order_amount}₴`);
                }
                deliveryFee = Number(city.delivery_fee);
            }
        }

        const cityDeliveryFee = deliveryFee;
        let finalAmount = totalAmount - discountAmount + cityDeliveryFee;

        // ... cashback logic ...
        let cashbackUsed = 0;
        if (dto.use_cashback && dto.user_id && dto.user_id !== 'guest') {
            const loyalty = await this.getLoyaltySettings();

            if (loyalty.enabled) {
                const user = await this.userRepo.findOneBy({ id: dto.user_id });
                if (user && user.cashback_balance > 0) {
                    const maxAllowed = finalAmount * (loyalty.maxUsePercent / 100);
                    cashbackUsed = Math.min(Number(user.cashback_balance), finalAmount, maxAllowed);
                    cashbackUsed = Math.floor(cashbackUsed);

                    if (cashbackUsed > 0) {
                        finalAmount -= cashbackUsed;
                        await this.userRepo.update(user.id, {
                            cashback_balance: Number(user.cashback_balance) - cashbackUsed
                        });
                    }
                }
            }
        }

        // 4. Создать заказ
        const order = this.orderRepo.create({
            user_id: dto.user_id === 'guest' ? null : dto.user_id,
            address_id: dto.address_id,
            address_text: dto.address_text,
            phone: dto.phone,
            courier_comment: dto.courier_comment,
            payment_method: dto.payment_method || 'cash_on_delivery',
            scheduled_time: dto.scheduled_time ? new Date(dto.scheduled_time) : undefined,
            total_amount: totalAmount,
            delivery_fee: cityDeliveryFee,
            discount_amount: discountAmount,
            cashback_used: cashbackUsed,
            final_amount: finalAmount,
            promo_code: dto.promo_code,
            order_type: dto.order_type || 'delivery',
            pickup_point_id: dto.pickup_point_id,
            city_id: dto.city_id,
            cutlery: dto.cutlery || 1,
        });

        const savedOrder = await this.orderRepo.save(order);

        // 6. Отправить уведомления
        try {
            await this.notificationsService.notifyNewOrder(savedOrder);
        } catch (e) {
            console.error('Failed to send notification', e);
        }

        // 5. Создать позиции заказа
        const saved = Array.isArray(savedOrder) ? savedOrder[0] : savedOrder;
        for (const item of orderItems) {
            const orderItem = this.itemRepo.create({
                ...item,
                order_id: saved.id,
            });
            await this.itemRepo.save(orderItem);
        }

        return this.getOrderById(saved.id);
    }

    async getOrderById(id: string) {
        return this.orderRepo.findOne({
            where: { id },
            relations: ['items', 'items.product', 'address'],
        });
    }

    async getUserOrders(userId: string) {
        return this.orderRepo.find({
            where: { user_id: userId },
            relations: ['items', 'items.product'],
            order: { created_at: 'DESC' },
        });
    }

    async getUserAddresses(userId: string) {
        return this.addressRepo.find({
            where: { user_id: userId },
            relations: ['city'],
            order: { street: 'ASC' }
        });
    }

    async saveAddress(data: Partial<Address>) {
        const addr = this.addressRepo.create(data);
        return this.addressRepo.save(addr);
    }

    private async getLoyaltySettings() {
        const settings = await this.settingRepo.find();
        return {
            enabled: settings.find(s => s.key === 'loyalty_enabled')?.value === 'true',
            percent: Number(settings.find(s => s.key === 'cashback_percent')?.value || 5),
            maxUsePercent: Number(settings.find(s => s.key === 'max_cashback_use_percent')?.value || 50),
        };
    }

    async updateOrderStatus(id: string, status: string) {
        const order = await this.getOrderById(id);
        if (!order) throw new BadRequestException('Заказ не найден');

        const prevStatus = order.order_status;
        await this.orderRepo.update(id, { order_status: status });

        // Начисление кэшбэка
        if (status === 'done' && prevStatus !== 'done' && order.user_id && order.user_id !== 'guest') {
            const loyalty = await this.getLoyaltySettings();
            if (loyalty.enabled) {
                const user = await this.userRepo.findOneBy({ id: order.user_id });
                if (user) {
                    const cashback = Math.floor(Number(order.final_amount) * (loyalty.percent / 100));
                    if (cashback > 0) {
                        const newBalance = Number(user.cashback_balance || 0) + cashback;
                        await this.userRepo.update(user.id, { cashback_balance: newBalance });
                        console.log(`[Loyalty] User ${user.id} earned ${cashback} points. New balance: ${newBalance}`);
                    }
                }
            }
        }

        return this.getOrderById(id);
    }

    async getDashboardStats(cityId?: number) {
        // Today
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0); const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
        // Yesterday
        const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(startOfYesterday); endOfYesterday.setHours(23, 59, 59, 999);
        // Week (7 days)
        const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfWeek.getDate() - 6);
        // Month (30 days)
        const startOfMonth = new Date(startOfToday); startOfMonth.setDate(startOfMonth.getDate() - 29);
        // Year (365 days)
        const startOfYear = new Date(startOfToday); startOfYear.setDate(startOfYear.getDate() - 364);

        const getStats = async (start: Date, end: Date) => {
            const where: any = { created_at: require('typeorm').Between(start, end) };
            if (cityId) where.city_id = cityId;
            const orders = await this.orderRepo.find({ where });
            const revenue = orders.reduce((sum, o) => sum + Number(o.final_amount), 0);
            const count = orders.length;

            // New clients
            const userWhere: any = { created_at: require('typeorm').Between(start, end) };
            const newClients = await this.userRepo.count({ where: userWhere });

            return {
                revenue,
                count,
                avgCheck: count > 0 ? Math.round(revenue / count) : 0,
                newClients
            };
        };

        const today = await getStats(startOfToday, endOfToday);
        const yesterday = await getStats(startOfYesterday, endOfYesterday);
        const week = await getStats(startOfWeek, endOfToday);
        const month = await getStats(startOfMonth, endOfToday);
        const year = await getStats(startOfYear, endOfToday);

        // Chart Data (Last 30 days)
        const chartData: { date: string, revenue: number, count: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(startOfToday);
            d.setDate(d.getDate() - i);
            const s = new Date(d); s.setHours(0, 0, 0, 0);
            const e = new Date(d); e.setHours(23, 59, 59, 999);

            const where: any = { created_at: require('typeorm').Between(s, e) };
            if (cityId) where.city_id = cityId;
            // Optimally we'd use a grouped query, but loop is fine for 30 days and low volume
            const dayOrders = await this.orderRepo.find({ where, select: ['final_amount'] });
            const dayRevenue = dayOrders.reduce((sum, o) => sum + Number(o.final_amount), 0);

            chartData.push({
                date: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
                revenue: dayRevenue,
                count: dayOrders.length
            });
        }

        return { today, yesterday, week, month, year, chartData };
    }
}

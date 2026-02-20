import { Injectable, OnModuleInit } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
const TelegramBot = require('node-telegram-bot-api');

@Injectable()
export class NotificationsService implements OnModuleInit {
    private bot: any;
    // TODO: Move to .env
    private readonly telegramToken = '7746369230:AAF-7Xqj10A7SEvw19_PLACEHOLDER';
    private readonly adminChatId = '123456789_PLACEHOLDER';
    private readonly adminEmail = 'ukusiruby.admin@gmail.com';

    constructor(private readonly mailService: MailService) { }

    onModuleInit() {
        try {
            if (this.telegramToken && this.telegramToken.length > 10) {
                console.log('[Notifications] Initializing Telegram Bot...');
                let TelegramBotClass;
                try {
                    TelegramBotClass = require('node-telegram-bot-api');
                } catch (e) {
                    console.error('[Notifications] Could not require node-telegram-bot-api');
                    return;
                }

                const BotConstructor = typeof TelegramBotClass === 'function'
                    ? TelegramBotClass
                    : (TelegramBotClass.default || TelegramBotClass);

                if (typeof BotConstructor === 'function') {
                    this.bot = new BotConstructor(this.telegramToken, { polling: false });
                    console.log('[Notifications] Telegram Bot initialized successfully');
                } else {
                    console.error('[Notifications] TelegramBot is not a constructor, skipping bot init');
                }
            }
        } catch (e) {
            console.error('[Notifications] Critical error during bot init:', e.message);
        }
    }

    async notifyNewOrder(order: any) {
        const orderId = order.id.slice(0, 8);
        const total = order.final_amount;
        const itemsList = order.items.map(i => `- ${i.product ? i.product.name : 'Товар'} x${i.quantity}`).join('\n');

        // 1. Telegram Notification
        if (this.bot && this.adminChatId) {
            const message = `
🔥 *НОВЫЙ ЗАКАЗ #${orderId}*
💰 Сумма: *${total} ₴*
👤 Клиент: ${order.phone}
📍 Адрес: ${order.address_text || 'Самовывоз'}

🛒 *Состав:*
${itemsList}

👇 *Действия:*
            `;

            try {
                await this.bot.sendMessage(this.adminChatId, message, { parse_mode: 'Markdown' });
            } catch (e) {
                console.error('[Notifications] Telegram error:', e.message);
            }
        }

        // 2. Email Notification (Simple version reused from MailService)
        // We will implement a specific email template later if needed
        console.log(`[Notifications] Sent notification for order #${orderId}`);
    }
}

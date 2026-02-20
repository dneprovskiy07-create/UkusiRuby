import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Address } from '../entities/address.entity';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

import { MailService } from '../mail/mail.service';

// В реальном приложении тут будет Redis для OTP
const otpStore = new Map<string, string>();

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Address)
        private readonly addressRepo: Repository<Address>,
        private readonly mailService: MailService,
    ) { }

    // --- Helpers for Password Hashing (MVP withoutbcrypt) ---
    private hashPassword(password: string): string {
        const salt = randomBytes(16).toString('hex');
        const hash = scryptSync(password, salt, 64).toString('hex');
        return `${salt}:${hash}`;
    }

    private verifyPassword(password: string, storedHash: string): boolean {
        const [salt, key] = storedHash.split(':');
        const derivedKey = scryptSync(password, salt, 64);
        const keyBuffer = Buffer.from(key, 'hex');
        return timingSafeEqual(derivedKey, keyBuffer);
    }

    // --- Auth Methods ---

    async register(data: { email: string; phone: string; name: string; password?: string }) {
        const existing = await this.userRepo.findOne({
            where: [{ email: data.email }, { phone: data.phone }],
        });

        if (existing) {
            throw new BadRequestException('Вы уже зарегистрированы, выполните вход');
        }

        const user = this.userRepo.create({
            email: data.email,
            phone: data.phone,
            name: data.name,
            password: data.password ? this.hashPassword(data.password) : undefined,
        });

        const savedUser = await this.userRepo.save(user);

        // Send welcome email (fire and forget / independent of registration success)
        if (savedUser.email) {
            try {
                // Pass the original raw password, not the hashed one!
                await this.mailService.sendWelcome(savedUser.email, savedUser.name || 'Пользователь', data.password);
            } catch (e) {
                console.error('[AuthService] Failed to send welcome email:', e.message);
                // Do not throw error, let registration succeed
            }
        }

        const { password: _, reset_token: _rt, ...safeUser } = savedUser as any;
        return safeUser;
    }

    async login(data: { email: string; password: string }) {
        const user = await this.userRepo.findOne({
            where: { email: data.email },
            select: ['id', 'email', 'phone', 'name', 'password', 'push_enabled', 'created_at'], // explicitly select password
        });

        if (!user || !user.password) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        if (!this.verifyPassword(data.password, user.password)) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        // Return user without password
        const { password, ...result } = user;
        return result;
    }

    async sendOtp(phone: string) {
        // Генерируем 4-значный код (MVP — хранение в памяти)
        const code = String(Math.floor(1000 + Math.random() * 9000));
        otpStore.set(phone, code);

        // TODO: Отправка SMS через провайдера (Twilio, SMS.ru, etc.)
        console.log(`[OTP] ${phone} → ${code}`);

        return { message: 'OTP отправлен', phone };
    }

    async verifyOtp(phone: string, code: string) {
        const stored = otpStore.get(phone);
        if (!stored || stored !== code) {
            return { success: false, message: 'Неверный код' };
        }

        otpStore.delete(phone);

        // Найти или создать пользователя
        let user = await this.userRepo.findOneBy({ phone });
        if (!user) {
            user = this.userRepo.create({ phone });
            user = await this.userRepo.save(user);
        }

        return { success: true, user };
    }

    async forgotPassword(email: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) return { message: 'Если email существует, мы отправили письмо' };

        // Generate token
        const token = randomBytes(32).toString('hex');
        user.reset_token = token;
        user.reset_token_expires = new Date(Date.now() + 3600000); // 1 hour
        await this.userRepo.save(user);

        // Send email
        await this.mailService.sendResetPassword(user.email, token);

        return { message: 'Письмо отправлено' };
    }

    async resetPassword(token: string, newPass: string) {
        const user = await this.userRepo.findOne({
            where: { reset_token: token },
            select: ['id', 'email', 'reset_token', 'reset_token_expires'], // select hidden fields
        });

        if (!user || user.reset_token_expires < new Date()) {
            throw new BadRequestException('Токен недействителен или истек');
        }

        user.password = this.hashPassword(newPass);
        user.reset_token = null as any;
        user.reset_token_expires = null as any;
        await this.userRepo.save(user);

        return { success: true, message: 'Пароль успешно изменен' };
    }

    async getProfile(userId: string) {
        return this.userRepo.findOne({
            where: { id: userId },
            relations: ['addresses', 'favorites', 'favorites.product', 'addresses.city'],
            order: {
                addresses: { id: 'DESC' }
            }
        });
    }

    async updateProfile(userId: string, data: Partial<User>) {
        // If updating password, hash it
        if (data.password) {
            data.password = this.hashPassword(data.password);
        }
        await this.userRepo.update(userId, data);
        return this.getProfile(userId);
    }

    // --- Address Management ---

    async addAddress(userId: string, data: Partial<Address>) {
        const address = this.addressRepo.create({
            ...data,
            user_id: userId
        });
        return this.addressRepo.save(address);
    }

    async deleteAddress(userId: string, addressId: string) {
        const address = await this.addressRepo.findOne({ where: { id: addressId, user_id: userId } });
        if (!address) {
            throw new NotFoundException('Адрес не найден');
        }
        await this.addressRepo.remove(address);
        return { success: true };
    }

    async getAddresses(userId: string) {
        return this.addressRepo.find({
            where: { user_id: userId },
            relations: ['city'],
            order: { id: 'DESC' }
        });
    }
}

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Real Gmail SMTP
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ukusiruby.kiev@gmail.com',
                pass: 'wzlc rhrn fvlq lajk' // App Password
            }
        });

        // Check connection
        this.transporter.verify((error, success) => {
            if (error) {
                console.log('[MailService] Error connecting to SMTP:', error);
            } else {
                console.log('[MailService] Gmail Server is ready to take our messages');
            }
        });
    }

    async sendWelcome(email: string, name: string, password?: string) {
        const info = await this.transporter.sendMail({
            from: '"UkusiRuby" <ukusiruby.kiev@gmail.com>',
            to: email,
            subject: 'Добро пожаловать в UkusiRuby! 🍣',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1 style="color: #FF5C00;">Привет, ${name}! 👋</h1>
                    <p>Спасибо за регистрацию в <b>UkusiRuby</b>.</p>
                    <p>Теперь вы можете заказывать любимые суши и роллы прямо со смартфона!</p>
                    
                    ${password ? `
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #666;">Ваши данные для входа:</p>
                        <p style="margin: 5px 0;"><b>Email:</b> ${email}</p>
                        <p style="margin: 5px 0;"><b>Пароль:</b> ${password}</p>
                    </div>
                    ` : ''}

                    <br>
                    <p>Приятного аппетита! 🥢</p>
                </div>
            `,
        });
        console.log(`[MailService] Welcome email sent to ${email}: ${info.messageId}`);
    }

    async sendResetPassword(email: string, token: string) {
        // Adjust this URL to your actual frontend URL (e.g. local IP if testing on phone)
        // For emulator/desktop: http://localhost:5173
        const resetLink = `http://localhost:5173/reset-password?token=${token}`;

        const info = await this.transporter.sendMail({
            from: '"UkusiRuby" <ukusiruby.kiev@gmail.com>',
            to: email,
            subject: 'Сброс пароля',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1 style="color: #FF5C00;">Сброс пароля</h1>
                    <p>Вы (или кто-то другой) запросили сброс пароля для вашего аккаунта.</p>
                    <p>Нажмите на кнопку ниже, чтобы задать новый пароль:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="padding: 12px 24px; background: #FF5C00; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Сбросить пароль</a>
                    </div>
                    <p>Или перейдите по ссылке: <a href="${resetLink}" style="color: #FF5C00;">${resetLink}</a></p>
                    <p style="font-size: 12px; color: #999;">Ссылка действительна 1 час. Если вы не запрашивали сброс, просто игнорируйте это письмо.</p>
                </div>
            `,
        });
        console.log(`[MailService] Reset email sent to ${email}: ${info.messageId}`);
    }
}

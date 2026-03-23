/**
 * Сервис отправки Email через Nodemailer.
 * Production-ready реализация с использованием SMTP.
 */
import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email';
import { logger } from '../utils/logger';

// Создаем transporter (рекомендуется создавать его один раз)
// В реальном приложении лучше вынести в отдельный модуль инициализации
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth,
});

export class EmailService {
  /**
   * Отправляет OTP код на почту пользователя.
   */
  static async sendOtpEmail(email: string, code: string): Promise<void> {
    try {
      // Проверка настройки (чтобы не крашилось в дев-среде без .env)
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        logger.warn(`[EMAIL SERVICE] SMTP credentials missing. Sending to console: ${code} -> ${email}`);
        return;
      }

      const info = await transporter.sendMail({
        from: emailConfig.from,
        to: email,
        subject: 'Код подтверждения GigaStudio Chat',
        text: `Ваш код подтверждения: ${code}. Код действителен 5 минут.`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Вход в GigaStudio Chat</h2>
            <p>Ваш код подтверждения:</p>
            <h1 style="color: #333; background: #f0f0f0; padding: 10px; display: inline-block; border-radius: 5px;">
              ${code}
            </h1>
            <p>Если вы не запрашивали этот код, игнорируйте письмо.</p>
          </div>
        `,
      });

      logger.info(`Email sent: ${info.messageId} to ${email}`);
    } catch (error) {
      logger.error('Failed to send email', error);
      // Не выбрасываем ошибку, чтобы не блокировать вход, если упала почта
      // Но в critical системах можно выбросить
      throw new Error('Не удалось отправить письмо. Попробуйте позже.');
    }
  }
}
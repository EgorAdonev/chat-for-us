/**
 * Сервис отправки Email через Nodemailer.
 * 
 * ВАЖНО: Для работы этого сервиса необходимо установить зависимости:
 * pnpm add nodemailer @types/nodemailer
 * 
 * И настроить переменные окружения в .env.local:
 * SMTP_HOST=smtp.example.com
 * SMTP_PORT=587
 * SMTP_USER=your_email@example.com
 * SMTP_PASS=your_password
 * SMTP_FROM="GigaStudio Chat" <noreply@gigastudio.ru>
 */
import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email';
import { logger } from '../utils/logger';

// Создаем транспортер (рекомендуется вынести создание за пределы класса для переиспользования соединения)
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure, // true for 465, false for other ports
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass,
  },
});

export class EmailService {
  /**
   * Отправляет OTP код на почту пользователя.
   * В случае ошибки выбрасывает исключение.
   */
  static async sendOtpEmail(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: 'Код подтверждения GigaStudio',
      text: `Ваш код подтверждения: ${code}\n\nЭтот код действителен в течение 5 минут.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Код подтверждения</h2>
          <p>Здравствуйте!</p>
          <p>Ваш код для входа в систему:</p>
          <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
            ${code}
          </div>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Если вы не запрашивали этот код, просто проигнорируйте это письмо.<br>
            Код действителен в течение 5 минут.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${email}`);
    } catch (error) {
      logger.error('Failed to send email via SMTP', error);
      throw new Error('Не удалось отправить письмо. Попробуйте позже.');
    }
  }
}
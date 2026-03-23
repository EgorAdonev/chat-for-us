/**
 * Сервис отправки Email (Mock implementation).
 * В данной конфигурации nodemailer заменен на консольное логирование
 * для исключения внешних зависимостей.
 */
import { logger } from '../utils/logger';

export class EmailService {
  /**
   * Отправляет OTP код на почту пользователя (имитация).
   */
  static async sendOtpEmail(email: string, code: string): Promise<void> {
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 500));

    logger.info(`[EMAIL MOCK] To: ${email} | Code: ${code}`);
    logger.info(`В реальном приложении здесь был бы вызов SMTP сервера (например, Nodemailer или SendGrid).`);
    
    // В реальном коде здесь была бы логика с throw new Error, если отправка не удалась,
    // но для mock-версии мы всегда считаем, что отправка прошла успешно.
    return;
  }
}
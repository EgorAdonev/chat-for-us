/**
 * Сервис аутентификации.
 * Содержит бизнес-логику: генерация кодов, валидация, управление сессиями.
 */
import { UserRepository } from '../repositories/user.repository';
import { User, AuthSession } from '../types';
import { logger } from '../utils/logger';

export class AuthService {
  /**
   * Иницирует процесс входа: генерирует код и "отправляет" его.
   */
  static async initiateLogin(email: string): Promise<void> {
    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Некорректный формат email');
    }

    // Проверка существования пользователя (опционально, можно скрывать)
    const existingUser = await UserRepository.findByEmail(email);
    
    // Генерация 6-значного кода
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    await UserRepository.saveOtp(email, code);
    
    // Имитация отправки email
    logger.info(`[EMAIL SERVICE] Sending code ${code} to ${email}`);
    // В реальном проде здесь вызов SMTP провайдера
  }

  /**
   * Проверяет код и выдает токен (регистрирует если нового пользователя).
   */
  static async verifyCode(email: string, code: string, name?: string): Promise<AuthSession> {
    const isValid = await UserRepository.verifyOtp(email, code);
    
    if (!isValid) {
      logger.warn(`Failed login attempt for ${email}`);
      throw new Error('Неверный код или срок действия истек');
    }

    let user = await UserRepository.findByEmail(email);

    // Регистрация нового пользователя, если имя предоставлено и пользователь не найден
    if (!user) {
      if (!name || name.trim().length === 0) {
        throw new Error('Имя обязательно для регистрации');
      }
      user = await UserRepository.create(email, name);
    } else if (name && user.name !== name) {
       // Опционально: разрешать смену имени
       user.name = name; 
    }

    await UserRepository.removeOtp(email);

    // Генерация JWT-подобного токена (упрощенно для demo)
    const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');

    const session: AuthSession = {
      token,
      user,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
    };

    return session;
  }
}
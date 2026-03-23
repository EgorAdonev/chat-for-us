/**
 * Auth Service с использованием JWT и Zod.
 */
import { UserRepository } from '../repositories/user.repository';
import { EmailService } from './email.service';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { LoginSchema, VerifyCodeSchema } from '../utils/validation';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export class AuthService {
  /**
   * Инициирует вход: валидирует данные и отправляет реальный Email.
   */
  static async initiateLogin(rawEmail: string): Promise<void> {
    // 1. Валидация (Zod)
    const validation = LoginSchema.safeParse({ email: rawEmail });
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }
    
    const { email } = validation.data;

    // 2. Проверка/Создание пользователя
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Создаем черновик пользователя (можно добавить флаг isVerified)
      // Для упрощения логики репозитория - просто проверяем
    }

    // 3. Генерация криптостойкого OTP
    const code = crypto.randomInt(100000, 999999).toString();

    // 4. Сохранение OTP в хранилище (с временем жизни 5 мин)
    await UserRepository.saveOtp(email, code, 5 * 60); 

    // 5. Отправка Email (Nodemailer)
    await EmailService.sendOtpEmail(email, code);
  }

  /**
   * Верифицирует код и выпускает JWT токен.
   */
  static async verifyCode(rawData: { email: string; code: string; name?: string }) {
    // 1. Валидация
    const validation = VerifyCodeSchema.safeParse(rawData);
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }
    
    const { email, code, name } = validation.data;

    // 2. Проверка OTP
    const isValid = await UserRepository.verifyOtp(email, code);
    if (!isValid) {
      throw new Error('Неверный код или срок действия истек');
    }

    // 3. Получение или создание пользователя
    let user = await UserRepository.findByEmail(email);
    
    if (!user) {
      if (!name) {
        throw new Error('Для завершения регистрации необходимо указать имя');
      }
      user = await UserRepository.create(email, name);
    } else if (name && user.name !== name) {
      // Обновляем имя если передано
      user.name = name; 
      // В реальной БД тут был бы update
    }

    // 4. Удаление использованного OTP
    await UserRepository.removeOtp(email);

    // 5. Генерация JWT (Access Token)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { token, user };
  }

  /**
   * Верифицирует JWT токен.
   */
  static verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    } catch (e) {
      return null;
    }
  }
}
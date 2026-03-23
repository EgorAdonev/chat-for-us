/**
 * Auth Service с использованием нативного Crypto (вместо JWT библиотеки).
 */
import { UserRepository } from '../repositories/user.repository';
import { EmailService } from './email.service';
import crypto from 'crypto';
import { LoginSchema, VerifyCodeSchema } from '../utils/validation';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// --- Native JWT Implementation Helpers ---

// Вспомогательная функция для Base64Url кодирования (требование стандарта JWT)
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

// Подпись токена (аналог jwt.sign)
function signToken(payload: { userId: string; email: string; role: string }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  const signatureData = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureData)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signatureData}.${signature}`;
}

// Верификация токена (аналог jwt.verify)
function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureData = `${encodedHeader}.${encodedPayload}`;

    // Пересчитываем подпись
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureData)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (signature !== expectedSignature) {
      return null;
    }

    // Декодируем payload
    const payloadStr = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadStr);

    // Проверка срока действия (опционально, здесь упрощено)
    return payload;
  } catch (e) {
    return null;
  }
}

// --- Auth Service Class ---

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
      user.name = name;
    }

    // 4. Удаление использованного OTP
    await UserRepository.removeOtp(email);

    // 5. Генерация токена через нативную функцию
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { token, user };
  }

  /**
   * Верифицирует токен через нативную функцию.
   */
  static verifyToken(token: string) {
    return verifyToken(token);
  }
}
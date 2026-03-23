/**
 * Обновленный репозиторий для работы с OTP и JWT данными.
 * В реальном проекте здесь используется Prisma Client.
 */
import { User } from '../types';
import { logger } from '../utils/logger';

// In-Memory storage (для запуска без БД)
const usersDb = new Map<string, User>();
const otpDb = new Map<string, { code: string; expiresAt: number }>();

export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    for (const user of usersDb.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  static async create(email: string, name: string): Promise<User> {
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      role: 'USER',
      createdAt: new Date(),
    };
    usersDb.set(newUser.id, newUser);
    logger.info(`User created: ${email}`);
    return newUser;
  }

  static async saveOtp(email: string, code: string, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    otpDb.set(email, { code, expiresAt });
    logger.info(`OTP generated for ${email}, expires at ${new Date(expiresAt).toISOString()}`);
  }

  static async verifyOtp(email: string, code: string): Promise<boolean> {
    const record = otpDb.get(email);
    if (!record) return false;
    
    // Проверка времени жизни
    if (Date.now() > record.expiresAt) {
      otpDb.delete(email);
      return false;
    }

    return record.code === code;
  }

  static async removeOtp(email: string): Promise<void> {
    otpDb.delete(email);
  }
}
/**
 * Репозиторий для управления пользователями.
 * Слой абстракции над хранилищем данных.
 */
import { User } from '../types';
import { logger } from '../utils/logger';

// In-Memory хранилище (замена БД)
const usersDb = new Map<string, User>();
const emailCodesDb = new Map<string, string>(); // email -> code
const passwordHashes = new Map<string, string>(); // email -> hash (имитация)

export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 100));
    
    for (const user of usersDb.values()) {
      if (user.email === email) {
        return user;
      }
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
    logger.info(`User created: ${newUser.id}`);
    return newUser;
  }

  static async saveOtp(email: string, code: string): Promise<void> {
    // Код истекает через 5 минут (логика должна быть в middleware, но здесь упростим)
    emailCodesDb.set(email, code);
    logger.info(`OTP saved for ${email}`);
  }

  static async verifyOtp(email: string, code: string): Promise<boolean> {
    const storedCode = emailCodesDb.get(email);
    return storedCode === code;
  }

  static async removeOtp(email: string): Promise<void> {
    emailCodesDb.delete(email);
  }
}
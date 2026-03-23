/**
 * Обновленный репозиторий для работы с OTP и JWT данными.
 * В реальном проекте здесь используется Prisma Client.
 * 
 * ВРЕМЕННОЕ РЕШЕНИЕ ДЛЯ РАЗРАБОТКИ:
 * Используем файловую систему для сохранения состояния между перезагрузками сервера (Hot Reload).
 */
import { User } from '../types';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

// Определяем пути к файлам хранилища
const DATA_DIR = path.join(process.cwd(), '.dev-data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OTP_FILE = path.join(DATA_DIR, 'otp.json');

// Убедимся, что папка существует
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Вспомогательные функции для работы с файлами
const readJsonFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data, (key, value) => {
        // Восстанавливаем объекты Date из строк
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });
    } catch (e) {
      logger.error(`Error reading file ${filePath}`, e);
      return {};
    }
  }
  return {};
};

const writeJsonFile = (filePath: string, data: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    logger.error(`Error writing file ${filePath}`, e);
  }
};

// Загружаем данные при старте
const usersDb = readJsonFile(USERS_FILE) as Record<string, User>;
const otpDb = readJsonFile(OTP_FILE) as Record<string, { code: string; expiresAt: number }>;

export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    for (const user of Object.values(usersDb)) {
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
    usersDb[newUser.id] = newUser;
    writeJsonFile(USERS_FILE, usersDb); // Сохраняем на диск
    logger.info(`User created: ${email}`);
    return newUser;
  }

  static async saveOtp(email: string, code: string, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    otpDb[email] = { code, expiresAt };
    writeJsonFile(OTP_FILE, otpDb); // Сохраняем на диск
    logger.info(`OTP generated for ${email}, expires at ${new Date(expiresAt).toISOString()}`);
  }

  static async verifyOtp(email: string, code: string): Promise<boolean> {
    const record = otpDb[email];
    if (!record) return false;
    
    // Проверка времени жизни
    if (Date.now() > record.expiresAt) {
      delete otpDb[email];
      writeJsonFile(OTP_FILE, otpDb);
      return false;
    }

    return record.code === code;
  }

  static async removeOtp(email: string): Promise<void> {
    if (otpDb[email]) {
      delete otpDb[email];
      writeJsonFile(OTP_FILE, otpDb); // Обновляем диск
    }
  }
}
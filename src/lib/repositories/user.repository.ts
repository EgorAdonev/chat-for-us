/**
 * Production-ready Repository using Prisma ORM.
 * Replaces file-system storage with a persistent database connection.
 */
import { User } from '../types';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user;
    } catch (error) {
      logger.error('Database error in findByEmail', error);
      throw new Error('Database error');
    }
  }

  static async create(email: string, name: string): Promise<User> {
    try {
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          role: 'USER',
        },
      });
      logger.info(`User created: ${email}`);
      return newUser;
    } catch (error) {
      logger.error('Database error in create', error);
      throw new Error('Failed to create user');
    }
  }

  static async saveOtp(email: string, code: string, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    try {
      await prisma.otp.upsert({
        where: { email },
        create: { email, code, expiresAt },
        update: { code, expiresAt },
      });
      logger.info(`OTP generated for ${email}`);
    } catch (error) {
      logger.error('Database error in saveOtp', error);
      throw new Error('Failed to save OTP');
    }
  }

  static async verifyOtp(email: string, code: string): Promise<boolean> {
    try {
      const record = await prisma.otp.findUnique({
        where: { email },
      });

      if (!record) return false;

      if (new Date() > record.expiresAt) {
        // Cleanup expired OTP
        await prisma.otp.delete({ where: { email } });
        return false;
      }

      return record.code === code;
    } catch (error) {
      logger.error('Database error in verifyOtp', error);
      return false;
    }
  }

  static async removeOtp(email: string): Promise<void> {
    try {
      await prisma.otp.delete({ where: { email } });
    } catch (error) {
      // Ignore error if OTP doesn't exist (idempotency)
      logger.warn('Failed to remove OTP (might not exist)', error);
    }
  }
}
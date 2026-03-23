/**
 * Production-ready Chat Repository using Prisma ORM.
 */
import { Message } from '../types';
import { logger } from '../utils/logger';
import { prisma } from './user.repository';

export class ChatRepository {
  static async addMessage(senderId: string, senderName: string, content: string): Promise<Message> {
    if (!content || content.trim().length === 0) {
      throw new Error("Message content cannot be empty");
    }

    try {
      const message = await prisma.message.create({
        data: {
          senderId,
          senderName,
          content,
        },
      });
      return message;
    } catch (error) {
      logger.error('Database error in addMessage', error);
      throw new Error('Failed to save message');
    }
  }

  static async getMessages(limit = 50): Promise<Message[]> {
    try {
      const messages = await prisma.message.findMany({
        orderBy: { timestamp: 'asc' },
        take: limit,
      });
      return messages;
    } catch (error) {
      logger.error('Database error in getMessages', error);
      throw new Error('Failed to fetch messages');
    }
  }

  static async searchUsers(query: string, currentUserId: string): Promise<{id: string, name: string}[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
          id: { not: currentUserId },
        },
        select: {
          id: true,
          name: true,
        },
        take: 10,
      });
      return users;
    } catch (error) {
      logger.error('Database error in searchUsers', error);
      return [];
    }
  }
}
/**
 * Репозиторий для управления сообщениями чата.
 */
import { Message } from '../types';
import { logger } from '../utils/logger';

// In-Memory хранилище сообщений
const messagesDb: Message[] = [];

export class ChatRepository {
  static async addMessage(senderId: string, senderName: string, content: string): Promise<Message> {
    if (!content || content.trim().length === 0) {
      throw new Error("Message content cannot be empty");
    }

    const message: Message = {
      id: crypto.randomUUID(),
      senderId,
      senderName,
      content,
      timestamp: new Date(),
    };

    messagesDb.push(message);
    logger.info(`Message added from ${senderName}`);
    return message;
  }

  static async getMessages(limit = 50): Promise<Message[]> {
    // Возвращаем последние сообщения
    return messagesDb.slice(-limit);
  }

  static async searchUsers(query: string, currentUserId: string): Promise<{id: string, name: string}[]> {
    // Заглушка поиска. В реальности обращались бы к UserRepository
    return [
      { id: '1', name: 'Алексей Иванов' },
      { id: '2', name: 'Мария Петрова' },
      { id: '3', name: 'Дмитрий Сидоров' },
    ].filter(u => u.name.toLowerCase().includes(query.toLowerCase()) && u.id !== currentUserId);
  }
}
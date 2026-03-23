import { NextRequest, NextResponse } from 'next/server';
import { ChatRepository } from '@/lib/repositories/chat.repository';
import { logger } from '@/lib/utils/logger';

/**
 * API Endpoint для чата
 * GET: получить сообщения
 * POST: отправить сообщение
 */
export async function GET(req: NextRequest) {
  try {
    // Простая проверка авторизации через cookies
    const token = req.cookies.get('auth_token');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await ChatRepository.getMessages();
    return NextResponse.json({ success: true, data: messages });

  } catch (error: any) {
    logger.error('Chat GET error', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Декодируем токен (упрощенно)
    let userPayload: any;
    try {
      userPayload = JSON.parse(Buffer.from(token.value, 'base64').toString());
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    const message = await ChatRepository.addMessage(
      userPayload.userId,
      userPayload.email.split('@')[0], // Имитация имени
      content
    );

    return NextResponse.json({ success: true, data: message });

  } catch (error: any) {
    logger.error('Chat POST error', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
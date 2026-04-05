import { NextRequest, NextResponse } from 'next/server';
import { ChatRepository } from '@/lib/repositories/chat.repository';
import { SendMessageSchema } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // Middleware проверил токен и добавил заголовки
    const userId = req.headers.get('x-user-id');
    if (!userId) throw new Error('Unauthorized');

    const messages = await ChatRepository.getMessages();
    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    logger.error('Chat GET error', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const userEmail = req.headers.get('x-user-email');
    
    if (!userId || !userEmail) throw new Error('Unauthorized');

    const body = await req.json();
    
    // Валидация входных данных
    const validation = SendMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.errors[0].message }, { status: 400 });
    }

    const { content } = validation.data;

    // Используем email как имя (или можем хранить имя в токене)
    const senderName = userEmail.split('@')[0]; 

    const message = await ChatRepository.addMessage(userId, senderName, content);
    return NextResponse.json({ success: true, data: message });

  } catch (error: any) {
    logger.error('Chat POST error', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
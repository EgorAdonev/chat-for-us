import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { GeoService } from '@/lib/services/geo.service';
import { logger } from '@/lib/utils/logger';

// Простая реализация in-memory Rate Limiter для избежания внешних зависимостей
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 минута

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(ip) || [];
  
  // Удаляем старые записи, которые вышли за временное окно
  const validTimestamps = timestamps.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Лимит превышен
  }
  
  // Добавляем текущий запрос
  validTimestamps.push(now);
  rateLimitStore.set(ip, validTimestamps);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting (IP)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' }, 
        { status: 429 }
      );
    }

    // 2. Geo Blocking
    if (!GeoService.isRegionAllowed(req.headers)) {
      logger.warn(`Access denied from non-RU region IP: ${ip}`);
      return NextResponse.json({ success: false, error: 'Service is only available in Russia' }, { status: 403 });
    }

    const body = await req.json();
    const code = await AuthService.initiateLogin(body.email);

    return NextResponse.json({
      success: true,
      message: 'Код подтверждения отправлен на вашу почту',
      // Возвращаем код только в режиме разработки для удобства тестирования
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    });

  } catch (error: any) {
    logger.error('Login API error', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
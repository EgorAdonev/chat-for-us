import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { GeoService } from '@/lib/services/geo.service';
import { logger } from '@/lib/utils/logger';
import { RateLimiterMemory } from 'rate-limiter-flexible'; // Защита от брута/DDoS

// Настройка Rate Limiter (ограничение: 5 запросов в минуту с одного IP)
const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting (IP)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    try {
      await rateLimiter.consume(ip);
    } catch (rej) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // 2. Geo Blocking
    if (!GeoService.isRegionAllowed(req.headers)) {
      logger.warn(`Access denied from non-RU region IP: ${ip}`);
      return NextResponse.json({ success: false, error: 'Service is only available in Russia' }, { status: 403 });
    }

    const body = await req.json();
    await AuthService.initiateLogin(body.email);

    return NextResponse.json({
      success: true,
      message: 'Код подтверждения отправлен на вашу почту',
    });

  } catch (error: any) {
    logger.error('Login API error', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
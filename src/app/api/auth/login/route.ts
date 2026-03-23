import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { GeoService } from '@/lib/services/geo.service';
import { logger } from '@/lib/utils/logger';

/**
 * API Endpoint для инициации входа (POST /api/auth/login)
 * Body: { email: string }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Geo-фильтрация (DDoS & Geo Protection simulation)
    if (!GeoService.isRegionAllowed(req.headers)) {
      logger.warn(`Access denied from non-RU region`);
      return NextResponse.json(
        { success: false, error: 'Service is only available in Russia' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email } = body;

    // 2. Валидация
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // 3. Business Logic
    await AuthService.initiateLogin(email);

    return NextResponse.json({
      success: true,
      message: 'Код отправлен на почту (смотрите в консоли сервера)',
    });

  } catch (error: any) {
    logger.error('Login error', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
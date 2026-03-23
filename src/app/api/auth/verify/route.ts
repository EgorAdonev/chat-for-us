import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { GeoService } from '@/lib/services/geo.service';
import { logger } from '@/lib/utils/logger';

/**
 * API Endpoint для верификации кода (POST /api/auth/verify)
 * Body: { email: string, code: string, name?: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!GeoService.isRegionAllowed(req.headers)) {
      return NextResponse.json(
        { success: false, error: 'Service is only available in Russia' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, code, name } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const session = await AuthService.verifyCode(email, code, name);

    // Установка cookies (httpOnly для безопасности)
    const response = NextResponse.json({ success: true, data: session.user });
    response.cookies.set('auth_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: session.expiresAt,
      path: '/',
    });

    return response;

  } catch (error: any) {
    logger.error('Verify error', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 401 }
    );
  }
}
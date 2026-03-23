import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, user } = await AuthService.verifyCode(body);

    // Установка HttpOnly Cookie с JWT
    const response = NextResponse.json({ success: true, data: user });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 часа
      path: '/',
    });

    return response;

  } catch (error: any) {
    logger.error('Verify API error', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 401 });
  }
}
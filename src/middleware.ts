import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';

/**
 * Middleware для защиты API маршрутов.
 * Проверяет наличие и валидность JWT токена.
 */
// Принудительно используем Node.js runtime, так как AuthService импортирует nodemailer,
// который не поддерживает Edge Runtime.
export const runtime = 'nodejs';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Защищаем API маршруты чата и пользователей
  if (pathname.startsWith('/api/chat') || pathname.startsWith('/api/users')) {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    // Добавляем информацию о пользователе в заголовки запроса для использования в route handlers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
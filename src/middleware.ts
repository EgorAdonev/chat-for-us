import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware для защиты API маршрутов.
 * Проверяет наличие и валидность JWT токена.
 * 
 * ВАЖНО: Мы не можем импортировать AuthService, так как он импортирует nodemailer,
 * что не поддерживается в Edge Runtime.
 * Поэтому реализуем верификацию токена напрямую, используя Web Crypto API.
 */

// Вспомогательная функция для декодирования Base64Url
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

// Валидация токена через Web Crypto API (доступно в Edge Runtime)
async function verifyToken(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Восстанавливаем данные для подписи
    const signatureData = `${encodedHeader}.${encodedPayload}`;
    
    // Секретный ключ
    const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);

    // Импортируем ключ для HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Проверяем подпись
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      Buffer.from(signature, 'base64url'), // Node/Bun может требовать base64, но в Edge Buffer understands standard base64. 
      // Если Buffer.from не работает как нужно с base64url, используем конвертацию:
      // Но стандарт crypto.subtle.verify принимает ArrayBuffer.
      // Подготовка сигнатуры:
      // Signature в JWT это Base64Url. Node Buffer.from понимает base64, не base64url.
      // Нужно сконвертировать.
      Uint8Array.from(Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64')),
      encoder.encode(signatureData)
    );

    if (!isValid) return null;

    // Декодируем payload
    const payloadStr = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadStr);

    return payload;
  } catch (e) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Защищаем API маршруты чата и пользователей
  if (pathname.startsWith('/api/chat') || pathname.startsWith('/api/users')) {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    // Добавляем информацию о пользователе в заголовки запроса
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
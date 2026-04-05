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

// Вспомогательная функция для декодирования Base64Url с восстановлением padding
function base64UrlDecode(str: string): string {
  // Заменяем символы Base64Url на стандартные Base64
  let replaced = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Добавляем padding, если его нет
  while (replaced.length % 4) {
    replaced += '=';
  }
  
  // Декодируем из Base64
  return Buffer.from(replaced, 'base64').toString('utf-8');
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

    // Правильная конвертация base64url строки в Uint8Array для Web Crypto
    const base64UrlStringToUint8Array = (base64UrlString: string) => {
      let padding = '='.repeat((4 - base64UrlString.length % 4) % 4);
      let base64String = (base64UrlString + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
      let rawData = atob(base64String);
      let outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    const signatureBuffer = base64UrlStringToUint8Array(signature);
    const dataBuffer = encoder.encode(signatureData);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      dataBuffer
    );

    if (!isValid) return null;

    // Декодируем payload
    const payloadStr = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadStr);

    return payload;
  } catch (e) {
    console.error('Middleware token verification error', e);
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
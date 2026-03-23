/**
 * Сервис проверки геолокации.
 * В реальном проекте использует IP-базы (MaxMind) или внешние API.
 */

export class GeoService {
  /**
   * Проверяет, находится ли пользователь в России.
   * Для демо-целей возвращаем true, если язык браузера ru.
   */
  static isRegionAllowed(headers: Headers): boolean {
    // Имитация geo-фильтрации на основе заголовка Accept-Language
    const acceptLanguage = headers.get('accept-language') || '';
    const isRussianContext = acceptLanguage.toLowerCase().includes('ru');
    
    // В реальном коде здесь была бы проверка IP адреса через БД
    return isRussianContext;
  }

  static getRegionCode(): string {
    return 'RU'; // Mock
  }
}
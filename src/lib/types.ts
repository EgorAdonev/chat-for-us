/**
 * Определение типов данных для доменной области.
 * Следует принципам чистой архитектуры и Google TypeScript Style Guide.
 */

/** Статус пользователя */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/** Модель пользователя */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

/** Сообщение в чате */
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

/** Сессия пользователя (токен) */
export interface AuthSession {
  token: string;
  user: User;
  expiresAt: Date;
}

/** DTO для запроса входа */
export interface LoginRequestDto {
  email: string;
}

/** DTO для подтверждения кода и регистрации */
export interface VerifyCodeRequestDto {
  email: string;
  code: string;
  name?: string; // Обязателен только при регистрации
}

/** Ответ API */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
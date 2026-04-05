/**
 * Схемы валидации данных с использованием Zod.
 */
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Некорректный формат email'),
});

export const VerifyCodeSchema = z.object({
  email: z.string().email('Некорректный формат email'),
  code: z.string().length(6, 'Код должен состоять из 6 цифр').regex(/^\d+$/, 'Код должен содержать только цифры'),
  name: z.string().min(2, 'Имя слишком короткое').optional(),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Сообщение не может быть пустым').max(1000, 'Сообщение слишком длинное'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type VerifyCodeInput = z.infer<typeof VerifyCodeSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
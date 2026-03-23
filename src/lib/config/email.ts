/**
 * Конфигурация Email сервиса.
 * Использует переменные окружения для безопасности.
 */
export const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: process.env.SMTP_FROM || '"GigaStudio Chat" <noreply@gigastudio.ru>',
};
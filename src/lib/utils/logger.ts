/**
 * Простой сервис логирования.
 * В продакшене заменяется на Winston или Pino.
 */
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private log(level: LogLevel, message: string, context?: unknown) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    if (context) {
      console.log(logEntry, context);
    } else {
      console.log(logEntry);
    }
  }

  info(message: string, context?: unknown) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: unknown) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: unknown) {
    this.log(LogLevel.ERROR, message, context);
  }
}

export const logger = new Logger();
/**
 * Production-ready Logger.
 * Outputs JSON in production for parsing by log aggregators (Datadog, ELK, etc.).
 */
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    
    if (this.isProduction) {
      // JSON Logging for Production
      const logEntry = {
        timestamp,
        level,
        message,
        ...(context && { context }),
      };
      console.log(JSON.stringify(logEntry));
    } else {
      // Human readable for Development
      const color = level === LogLevel.ERROR ? '\x1b[31m' : level === LogLevel.WARN ? '\x1b[33m' : '\x1b[36m';
      const reset = '\x1b[0m';
      const logEntry = `[${timestamp}] [${level}] ${message}`;
      
      if (context) {
        console.log(`${color}${logEntry}${reset}`, context);
      } else {
        console.log(`${color}${logEntry}${reset}`);
      }
    }
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context);
  }
}

export const logger = new Logger();
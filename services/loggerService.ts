

import { CONFIG } from '../config';
import { captureException, captureMessage, addBreadcrumb } from './monitoringService';

type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    
    // Always log to console with rich formatting for better visibility during testing/MVP
    const styles = {
      info: 'color: #007AFF',
      warn: 'color: #FF9500',
      error: 'color: #FF3B30'
    };
    
    // Fallback if data is undefined
    const logData = data !== undefined ? data : '';
    
    // Log with color
    console[level](`%c[${level.toUpperCase()}] ${message}`, styles[level], logData);
    
    // Send to monitoring service in production
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env.PROD) {
      if (level === 'error') {
        const error = data instanceof Error ? data : new Error(message);
        captureException(error, { originalMessage: message, data });
      } else {
        captureMessage(message, level);
      }
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
    addBreadcrumb(message, 'info', data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
    addBreadcrumb(message, 'warning', data);
  }

  error(message: string, error?: any) {
    // Handle Error objects specifically to extract stack traces
    const errorData = error instanceof Error ? { 
        message: error.message, 
        stack: error.stack, 
        name: error.name 
    } : error;
    
    this.log('error', message, errorData);
    
    // Capture exception for monitoring
    if (error instanceof Error) {
      captureException(error, { context: message });
    } else {
      captureException(new Error(message), { originalError: error });
    }
  }

  logUserAction(action: string, details?: any) {
    this.info(`User Action: ${action}`, details);
    addBreadcrumb(action, 'user-action', details);
  }
}

export const logger = new Logger();
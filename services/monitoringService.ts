/**
 * Production Monitoring Service
 * Integrates Sentry for error tracking, performance monitoring, and logging
 */

import { CONFIG } from '../config';

// Sentry will be loaded dynamically to avoid bundle bloat if not configured
let Sentry: any = null;
let isInitialized = false;

export const initMonitoring = async () => {
  // Only initialize in production
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && !import.meta.env.PROD) {
    return;
  }

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (!sentryDsn) {
    console.warn('⚠️ Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  try {
    // Dynamic import to reduce bundle size
    Sentry = await import('@sentry/react');
    
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.PROD ? 'production' : 'development',
      release: CONFIG.version,
      
      // Enable structured logging
      _experiments: {
        enableLogs: true,
      },
      
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
        // Capture console.log, console.warn, console.error as Sentry logs
        Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Filter out sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from errors
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
        }
        return event;
      },
    });

    isInitialized = true;
    console.log('✅ Sentry monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

/**
 * Start a performance span for tracking specific operations
 * Use for measuring button clicks, API calls, and important user actions
 */
export const startSpan = <T>(
  options: { op: string; name: string; attributes?: Record<string, string | number | boolean> },
  callback: () => T
): T => {
  if (!isInitialized || !Sentry) {
    return callback();
  }
  
  return Sentry.startSpan(
    {
      op: options.op,
      name: options.name,
    },
    (span: any) => {
      if (options.attributes && span) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }
      return callback();
    }
  );
};

/**
 * Start an async performance span
 * Use for async operations like API calls
 */
export const startSpanAsync = async <T>(
  options: { op: string; name: string; attributes?: Record<string, string | number | boolean> },
  callback: () => Promise<T>
): Promise<T> => {
  if (!isInitialized || !Sentry) {
    return callback();
  }
  
  return Sentry.startSpan(
    {
      op: options.op,
      name: options.name,
    },
    async (span: any) => {
      if (options.attributes && span) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }
      return await callback();
    }
  );
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (!isInitialized || !Sentry) {
    console.error('Error (Sentry not initialized):', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (!isInitialized || !Sentry) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  Sentry.captureMessage(message, level);
};

export const setUser = (userId: string, email?: string) => {
  if (!isInitialized || !Sentry) return;
  
  Sentry.setUser({
    id: userId,
    email: email,
  });
};

export const clearUser = () => {
  if (!isInitialized || !Sentry) return;
  Sentry.setUser(null);
};

export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  if (!isInitialized || !Sentry) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
};


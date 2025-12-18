/**
 * Centralized logging service for consistent error handling
 * Replaces scattered console.log/error calls
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Note: We avoid synchronous require() of optional packages to stay ESM-compatible.
// When SENTRY_DSN is set we attempt to dynamically import @sentry/node in a non-blocking microtask.

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.logLevel = process.env.LOG_LEVEL || (this.isDevelopment ? 'DEBUG' : 'INFO');
    this._sentryWarned = false;
  }

  _shouldLog(level) {
    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  _formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level}] ${message} ${contextStr}`;
  }

  error(message, error = null, context = {}) {
    if (!this._shouldLog(LOG_LEVELS.ERROR)) return;

    // Support calls in two shapes:
    // 1) logger.error(message, ErrorInstance, context)
    // 2) logger.error(message, { error: ErrorInstance, ...context })
    let errInstance = null;
    let ctx = context || {};

    if (error && error instanceof Error) {
      errInstance = error;
    } else if (error && typeof error === 'object' && !(error instanceof Error)) {
      // If second arg is an object that may contain { error }
      if (error.error instanceof Error) {
        errInstance = error.error;
        const copy = { ...error };
        delete copy.error;
        ctx = { ...copy, ...ctx };
      } else {
        // It's plain context
        ctx = { ...error, ...ctx };
      }
    }

    const errorDetails = errInstance ? {
      message: errInstance.message,
      stack: errInstance.stack,
      ...ctx
    } : (Object.keys(ctx || {}).length ? ctx : { raw: error });

    // Print formatted message and attach the structured error details as a second arg
    console.error(this._formatMessage('ERROR', message), errorDetails);

    // Send to Sentry in production (if configured). Determine what to report.
    const self = this;
    const reportCandidate = errInstance || (Object.keys(ctx || {}).length ? ctx : (error ? error : null));
    if (process.env.SENTRY_DSN && reportCandidate) {
      (async () => {
        try {
          const SentryModule = await import('@sentry/node');
          const Sentry = SentryModule.default || SentryModule;
          if (!Sentry.getCurrentHub().getClient()) {
            Sentry.init({ dsn: process.env.SENTRY_DSN });
          }
          // Prefer Error instance when available
          Sentry.captureException(errInstance || reportCandidate, { extra: ctx });
        } catch (sentryError) {
          if (process.env.NODE_ENV !== 'test' && !self._sentryWarned) {
            console.warn('[logger] SENTRY_DSN is set but @sentry/node failed to load. Skipping Sentry reporting.');
            self._sentryWarned = true;
          }
        }
      })();
    }
  }

  warn(message, context = {}) {
    if (!this._shouldLog(LOG_LEVELS.WARN)) return;
    console.warn(this._formatMessage('WARN', message, context));
  }

  info(message, context = {}) {
    if (!this._shouldLog(LOG_LEVELS.INFO)) return;
    console.log(this._formatMessage('INFO', message, context));
  }

  debug(message, context = {}) {
    if (!this._shouldLog(LOG_LEVELS.DEBUG)) return;
    if (this.isDevelopment) {
      console.log(this._formatMessage('DEBUG', message, context));
    }
  }

  // Special method for auth logs (always logged for security)
  auth(message, context = {}) {
    console.log(this._formatMessage('AUTH', message, {
      ...context,
      timestamp: Date.now()
    }));
  }
}

export default new Logger();

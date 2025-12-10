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

// Cache whether @sentry/node is available to avoid noisy require errors
let _sentryAvailable = null;
function isSentryAvailable() {
  if (_sentryAvailable !== null) return _sentryAvailable;
  try {
    require.resolve('@sentry/node');
    _sentryAvailable = true;
  } catch (e) {
    _sentryAvailable = false;
  }
  return _sentryAvailable;
}

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.logLevel = process.env.LOG_LEVEL || (this.isDevelopment ? 'DEBUG' : 'INFO');
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

    const errorDetails = error ? {
      message: error.message,
      // Include stack always to aid remote debugging (safe because we sanitize payloads elsewhere)
      stack: error.stack,
      ...context
    } : context;

    console.error(this._formatMessage('ERROR', message, errorDetails));

    // Send to Sentry in production (if configured)
    if (process.env.SENTRY_DSN && error) {
      if (!isSentryAvailable()) {
        // Avoid spamming logs when Sentry is configured but the package isn't installed
        if (process.env.NODE_ENV !== 'test') {
          console.warn('[logger] SENTRY_DSN is set but @sentry/node is not installed. Skipping Sentry reporting.');
        }
      } else {
        try {
          // Lazy load Sentry only if DSN is set and package is available
          const Sentry = require('@sentry/node');
          if (!Sentry.getCurrentHub().getClient()) {
            Sentry.init({ dsn: process.env.SENTRY_DSN });
          }
          Sentry.captureException(error, { extra: context });
        } catch (sentryError) {
          console.error('Failed to send error to Sentry:', sentryError.message);
        }
      }
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

module.exports = new Logger();

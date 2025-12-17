/**
 * Unified Response Wrapper Middleware
 * Standardizes all API responses across the application
 * 
 * @module middleware/response-wrapper
 */

const logger = require('../utils/logger');

/**
 * Success Response Format
 * {
 *   success: true,
 *   status: 200,
 *   data: { ... },
 *   message: "Operation successful"
 * }
 */

/**
 * Error Response Format
 * {
 *   success: false,
 *   status: 400,
 *   error: "Error message",
 *   details: { ... }
 * }
 */

/**
 * Attach response helper functions to response object
 * @param {express.Response} res - Express response object
 * @returns {void}
 */
function attachResponseHelpers(res) {
  /**
   * Send success response
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} status - HTTP status code (default: 200)
   */
  res.success = function(data, message = 'Success', status = 200) {
    const payload = {
      success: true,
      status,
      message
    };

    // Only include data if it's not empty
    if (data !== null && data !== undefined) {
      payload.data = data;
    }

    logger.debug(`Response sent: ${status}`, { message, hasData: !!data });
    return this.status(status).json(payload);
  };

  /**
   * Send error response
   * @param {string} error - Error message
   * @param {number} status - HTTP status code (default: 400)
   * @param {*} details - Additional error details
   */
  res.error = function(error, status = 400, details = null) {
    const payload = {
      success: false,
      status,
      error: error || 'An error occurred'
    };

    // Only include details if provided
    if (details) {
      payload.details = details;
    }

    logger.warn(`Error response: ${status}`, { error, details });
    return this.status(status).json(payload);
  };

  /**
   * Send paginated response
   * @param {*} data - Array of items
   * @param {number} total - Total count
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {string} message - Success message
   */
  res.paginated = function(data, total, page, limit, message = 'Data retrieved') {
    const totalPages = Math.ceil(total / limit);
    
    const payload = {
      success: true,
      status: 200,
      message,
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasMore: page < totalPages
      }
    };

    logger.debug('Paginated response sent', { 
      total, 
      page, 
      limit, 
      totalPages 
    });

    return this.json(payload);
  };

  /**
   * Send validation error response
   * @param {Object} errors - Object with field names and error messages
   */
  res.validationError = function(errors) {
    const payload = {
      success: false,
      status: 422,
      error: 'Validation failed',
      validationErrors: errors
    };

    logger.warn('Validation error', { errors });
    return this.status(422).json(payload);
  };
}

/**
 * Middleware to attach response helpers
 * @returns {express.Middleware}
 */
function responseWrapperMiddleware() {
  return (req, res, next) => {
    attachResponseHelpers(res);
    next();
  };
}

module.exports = {
  responseWrapperMiddleware,
  attachResponseHelpers
};

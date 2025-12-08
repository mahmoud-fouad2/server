const validator = require('validator');
const sanitizeHtml = require('sanitize-html');

/**
 * Input sanitization middleware
 * Sanitizes user inputs to prevent XSS and injection attacks
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = validator.escape(req.query[key]);
      }
    });
  }

  // Sanitize body parameters
  if (req.body) {
    sanitizeObject(req.body);
  }

  // Sanitize route parameters
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = validator.escape(req.params[key]);
      }
    });
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return;

  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      // For specific fields that might contain HTML (like knowledge base content)
      if (key === 'content' || key === 'message' || key === 'feedback') {
        // ✅ PROPER HTML SANITIZATION
        obj[key] = sanitizeHtml(obj[key], {
          allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
          allowedAttributes: {
            'a': ['href', 'target']
          },
          allowedSchemes: ['http', 'https', 'mailto'],
          disallowedTagsMode: 'discard'
        });
        // Remove any remaining control characters
        obj[key] = validator.stripLow(obj[key]);
      } else {
        // Escape all HTML for other fields
        obj[key] = validator.escape(obj[key]);
      }
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  });
}

module.exports = {
  sanitizeInput
};
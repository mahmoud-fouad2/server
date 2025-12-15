function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return input;
  // Remove HTML tags
  let s = input.replace(/<[^>]*>/g, '');
  // Remove javascript: URIs
  s = s.replace(/javascript:/gi, '');
  // Strip control characters and trim
  s = s.replace(/[\x00-\x1F\x7F]/g, '').trim();
  return s;
}

module.exports = { sanitizeInput };
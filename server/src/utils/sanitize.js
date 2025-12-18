function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return input;
  // Remove HTML tags
  let s = input.replace(/<[^>]*>/g, '');
  // Remove javascript: URIs
  s = s.replace(/javascript:/gi, '');
  // Strip control characters and trim (avoid control-character regex literals)
  s = Array.from(s).filter(ch => { const c = ch.charCodeAt(0); return c >= 32 && c !== 127; }).join('').trim();
  return s;
}

export { sanitizeInput };
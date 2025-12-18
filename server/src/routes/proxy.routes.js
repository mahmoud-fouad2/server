import express from 'express';
const router = express.Router();
import logger from '../utils/logger.js';

/**
 * Simple proxy endpoints to forward requests to external APIs and avoid CORS
 * Example: POST /api/proxy/chat/message -> forwards to EXTERNAL_API_BASE + /api/chat/message
 */
// Default to the canonical production API host (faheemly) but allow override via env
const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE || 'https://faheemly.com';

// Generic POST forwarder for chat/message
router.post('/chat/message', async (req, res) => {
  try {
    const targetUrl = `${EXTERNAL_API_BASE}/api/chat/message`;

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // forward auth if present
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {})
      },
      body: JSON.stringify(req.body),
      // set a reasonable timeout via AbortController if needed by caller
    };

    const response = await fetch(targetUrl, fetchOptions);
    const text = await response.text();

    // try to parse as json, otherwise send raw text
    try {
      const json = JSON.parse(text);
      res.status(response.status).json(json);
    } catch (e) {
      res.status(response.status).send(text);
    }
  } catch (error) {
    logger.error('[Proxy] chat/message forward error', { error });
    res.status(502).json({ success: false, message: 'Proxy forward failed', error: error.message });
  }
});

export default router;

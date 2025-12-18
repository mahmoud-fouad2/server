import logger from '../utils/logger.js';

// Simple in-memory Server-Sent Events broadcaster for widget config updates
const subscribers = new Map(); // businessId -> Set of response objects

function addSubscriber(businessId, res) {
  if (!subscribers.has(businessId)) subscribers.set(businessId, new Set());
  subscribers.get(businessId).add(res);
  try { logger.info('SSE subscriber added', { businessId, total: subscribers.get(businessId).size }); } catch (e) {}
}

function removeSubscriber(businessId, res) {
  if (!subscribers.has(businessId)) return;
  subscribers.get(businessId).delete(res);
  try { logger.info('SSE subscriber removed', { businessId, total: subscribers.get(businessId).size }); } catch (e) {}
  if (subscribers.get(businessId).size === 0) subscribers.delete(businessId);
}

function send(businessId, eventName = 'CONFIG_UPDATED', data = {}) {
  const set = subscribers.get(businessId);
  if (!set) return;
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  try { logger.info('SSE broadcast', { businessId, eventName, recipients: set.size }); } catch (e) {}
  for (const res of set) {
    try {
      res.write(payload);
    } catch (e) {
      // ignore - will be cleaned up on close
    }
  }
}

export default {
  addSubscriber,
  removeSubscriber,
  send
};
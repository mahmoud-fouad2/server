const { Queue, QueueScheduler } = require('bullmq');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Lazily initialize queue & scheduler to avoid creating background Redis connections
// during tests (which can cause Jest to report open handles/leaks).
let chunkQueue = null;
let scheduler = null;

function initQueues() {
	if (chunkQueue) return { chunkQueue, scheduler };
	const connection = { connection: { url: REDIS_URL } };
	chunkQueue = new Queue('process-chunk', connection);
	scheduler = new QueueScheduler('process-chunk', connection).catch(err => logger.warn('QueueScheduler error', { error: err }));
	return { chunkQueue, scheduler };
}

function getChunkQueue() {
	// Don't auto-start queues in test environment
	if (process.env.NODE_ENV === 'test') return null;
	if (!chunkQueue) initQueues();
	return chunkQueue;
}

async function closeQueues() {
	if (chunkQueue) {
		try {
			await chunkQueue.close();
		} catch (e) {
			logger.warn('Failed to close chunkQueue', { error: e.message || e });
		}
		chunkQueue = null;
	}
	if (scheduler) {
		try {
			await scheduler.close();
		} catch (e) {
			logger.warn('Failed to close scheduler', { error: e.message || e });
		}
		scheduler = null;
	}
}

// Backwards compatible export: `chunkQueue` will be null in test env, and lazily
// initialized in non-test environments.
module.exports = { getChunkQueue, initQueues, closeQueues, chunkQueue: getChunkQueue() };

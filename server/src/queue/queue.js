const { Queue, QueueScheduler } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const connection = { connection: { url: REDIS_URL } };

// Main queue for chunk processing
const chunkQueue = new Queue('process-chunk', connection);

// Create a scheduler (necessary for delayed/retry jobs)
const scheduler = new QueueScheduler('process-chunk', connection).catch(err => console.warn('QueueScheduler error', err));

module.exports = { chunkQueue };

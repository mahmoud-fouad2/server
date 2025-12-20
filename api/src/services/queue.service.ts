import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import cacheService from '../services/cache.service.js';
import logger from '../utils/logger.js';

interface QueueConfig {
  connection: any;
  defaultJobOptions: any;
}

class QueueService {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private connection: any;

  constructor() {
    const redisClient = cacheService.getRedisClient();
    
    if (redisClient) {
      this.connection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      };
    } else {
      logger.warn('Redis not available, queue system will not function');
    }
  }

  createQueue(name: string): Queue | null {
    if (!this.connection) {
      logger.warn(`Cannot create queue ${name} without Redis connection`);
      return null;
    }

    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    try {
      const queue = new Queue(name, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            count: 100,
            age: 24 * 3600, // 24 hours
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // 7 days
          },
        },
      });

      this.queues.set(name, queue);
      logger.info(`Queue '${name}' created successfully`);
      return queue;
    } catch (error) {
      logger.error(`Failed to create queue '${name}':`, error);
      return null;
    }
  }

  createWorker(
    name: string,
    processor: (job: Job) => Promise<any>,
    options?: any
  ): Worker | null {
    if (!this.connection) {
      logger.warn(`Cannot create worker ${name} without Redis connection`);
      return null;
    }

    if (this.workers.has(name)) {
      return this.workers.get(name)!;
    }

    try {
      const worker = new Worker(name, processor, {
        connection: this.connection,
        concurrency: options?.concurrency || 5,
        ...options
      });

      worker.on('completed', (job) => {
        logger.info(`Job ${job.id} in queue '${name}' completed`);
      });

      worker.on('failed', (job, err) => {
        logger.error(`Job ${job?.id} in queue '${name}' failed:`, err);
      });

      this.workers.set(name, worker);
      logger.info(`Worker for queue '${name}' created successfully`);
      return worker;
    } catch (error) {
      logger.error(`Failed to create worker for '${name}':`, error);
      return null;
    }
  }

  async addJob(
    queueName: string,
    jobName: string,
    data: any,
    options?: any
  ): Promise<Job | null> {
    const queue = this.queues.get(queueName) || this.createQueue(queueName);
    
    if (!queue) {
      logger.error(`Queue '${queueName}' not available`);
      return null;
    }

    try {
      const job = await queue.add(jobName, data, options);
      logger.debug(`Job '${jobName}' added to queue '${queueName}'`);
      return job;
    } catch (error) {
      logger.error(`Failed to add job '${jobName}' to queue '${queueName}':`, error);
      return null;
    }
  }

  async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }

    try {
      const job = await queue.getJob(jobId);
      return job || null;
    } catch (error) {
      logger.error(`Failed to get job ${jobId} from queue ${queueName}:`, error);
      return null;
    }
  }

  async removeJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    try {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to remove job ${jobId} from queue ${queueName}:`, error);
      return false;
    }
  }

  async closeQueue(name: string): Promise<void> {
    const queue = this.queues.get(name);
    const worker = this.workers.get(name);
    const events = this.queueEvents.get(name);

    if (queue) {
      await queue.close();
      this.queues.delete(name);
    }

    if (worker) {
      await worker.close();
      this.workers.delete(name);
    }

    if (events) {
      await events.close();
      this.queueEvents.delete(name);
    }

    logger.info(`Queue '${name}' closed`);
  }

  async closeAll(): Promise<void> {
    const queueNames = Array.from(this.queues.keys());
    await Promise.all(queueNames.map((name) => this.closeQueue(name)));
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  getAllQueues(): Map<string, Queue> {
    return this.queues;
  }

  getWorker(name: string): Worker | undefined {
    return this.workers.get(name);
  }
}

export default new QueueService();

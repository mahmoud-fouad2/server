
const Redis = require('ioredis');

const redisUrl = 'redis://default:rkSQTYTGg3xpnP8Fm8XMnGw5RSr0kUek@redis-12651.c253.us-central1-1.gce.cloud.redislabs.com:12651';

console.log('Connecting to Redis...');
const redis = new Redis(redisUrl);

redis.on('connect', () => {
  console.log('✅ Connected to Redis!');
  
  redis.flushall().then(() => {
    console.log('🗑️  Cache FLUSHED successfully!');
    redis.quit();
    process.exit(0);
  }).catch((err) => {
    console.error('❌ Failed to flush cache:', err);
    redis.quit();
    process.exit(1);
  });
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
  process.exit(1);
});

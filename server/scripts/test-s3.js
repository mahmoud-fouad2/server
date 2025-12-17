// Simple S3 connectivity check using AWS SDK v3
// Usage: set env vars (S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) then run:
// node scripts/test-s3.js

const { S3Client, ListObjectsCommand } = require('@aws-sdk/client-s3');

async function main() {
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
  if (!bucket) {
    console.error('S3_BUCKET or AWS_S3_BUCKET is not set');
    process.exit(2);
  }

  const config = {
    region: process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1'
  };
  if (process.env.S3_ENDPOINT) config.endpoint = process.env.S3_ENDPOINT;
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    };
  }
  // forcePathStyle for many S3-compatible providers
  config.forcePathStyle = !!process.env.S3_ENDPOINT;

  const client = new S3Client(config);
  try {
    console.log('Listing objects in', bucket);
    const cmd = new ListObjectsCommand({ Bucket: bucket, MaxKeys: 10 });
    const res = await client.send(cmd);
    console.log('OK: found', (res.Contents || []).length, 'objects');
    (res.Contents || []).slice(0,10).forEach(o => console.log('-', o.Key));
    process.exit(0);
  } catch (e) {
    console.error('S3 connectivity test failed:', e.message || e);
    process.exit(1);
  }
}

main();
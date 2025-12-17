const fs = require('fs');
const logger = require('../utils/logger');

// Optional S3 support using AWS SDK v3. If S3 env vars present, we'll use S3.
let s3Client = null;
let S3 = null;
let S3_PRESIGNER = null;
// Support multiple env var names for compatibility and S3-compatible endpoints
const S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;
if (S3_BUCKET) {
  logger.info('S3 configuration detected:', {
    bucket: S3_BUCKET,
    region: process.env.AWS_REGION || process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    hasCredentials: !!(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY)
  });
  try {
    // Lazy require so local dev without AWS SDK still works
    S3 = require('@aws-sdk/client-s3');
    const { S3Client } = S3;

    const s3Config = {
      region: process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1'
    };

    // Support custom S3-compatible endpoints (e.g., Supabase)
    if (process.env.S3_ENDPOINT) {
      s3Config.endpoint = process.env.S3_ENDPOINT;
      // Use path style for some S3-compatible providers if needed
      s3Config.forcePathStyle = true;
    }

    // Support explicit access key/secret (for S3-compatible providers)
    if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
      s3Config.credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
      };
    }

    s3Client = new S3Client(s3Config);
    try {
      S3_PRESIGNER = require('@aws-sdk/s3-request-presigner').getSignedUrl;
    } catch (e) {
      // optional - signed URL support won't be available without this package
      S3_PRESIGNER = null;
    }
  } catch (e) {
    logger.warn('AWS SDK not available or failed to init - falling back to local disk storage');
    s3Client = null;
  }
}

const S3_ENABLED = !!(s3Client && S3_BUCKET);

if (S3_ENABLED) {
  logger.info('✅ S3 storage enabled successfully');
} else {
  logger.info('ℹ️ S3 storage not enabled, using local disk storage');
}

async function uploadToS3(localFilePath, destKey, contentType) {
  const fsPromises = fs.promises;
  try {
    const fileBuffer = await fsPromises.readFile(localFilePath);
    const params = {
        Bucket: S3_BUCKET,
      Key: destKey,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read'
    };

    const putCmd = new S3.PutObjectCommand(params);
    await s3Client.send(putCmd);

    // Construct public URL - allow override via S3_PUBLIC_URL
    if (process.env.S3_PUBLIC_URL) {
      return `${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/${destKey}`;
    }

    // If custom endpoint specified, use it as base
    if (process.env.S3_ENDPOINT) {
      return `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${destKey}`;
    }

    // Default S3 virtual-hosted style
    const region = process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1';
    return `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${destKey}`;
  } catch (e) {
    logger.error('S3 upload failed', e);
    throw e;
  }
}

async function uploadFile(localFilePath, destKey, contentType) {
  // Generic wrapper so callers can specify arbitrary destKey
  if (!S3_ENABLED) return null;
  return await uploadToS3(localFilePath, destKey, contentType);
}

async function getSignedUrlForKey(key, expiresIn = 3600) {
  if (!S3_ENABLED || !S3_PRESIGNER) return null;
  try {
    const { GetObjectCommand } = S3;
    const cmd = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key });
    return await S3_PRESIGNER(s3Client, cmd, { expiresIn });
  } catch (e) {
    logger.warn('Failed to generate presigned URL', e.message || e);
    return null;
  }
}

module.exports = {
  isS3Enabled: () => S3_ENABLED,

  uploadIcon: async (localFilePath, filename, contentType) => {
    if (!S3_ENABLED) return null;

    const destKey = `uploads/icons/${filename}`;
    const url = await uploadToS3(localFilePath, destKey, contentType);

    // Remove local temp file if exists
    try { if (fs.existsSync(localFilePath)) await fs.promises.unlink(localFilePath); } catch (e) { /* ignore */ }

    return url;
  }
  ,
  // Expose generic upload & presign functions for migration and signed downloads
  uploadFile: uploadFile,
  getSignedUrl: getSignedUrlForKey
};

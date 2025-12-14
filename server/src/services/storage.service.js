const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Optional S3 support using AWS SDK v3. If S3 env vars present, we'll use S3.
let s3Client = null;
let S3 = null;
let S3_PRESIGNER = null;
if (process.env.AWS_S3_BUCKET) {
  try {
    // Lazy require so local dev without AWS SDK still works
    S3 = require('@aws-sdk/client-s3');
    const { S3Client } = S3;
    s3Client = new S3Client({ region: process.env.AWS_REGION });
    try {
      S3_PRESIGNER = require('@aws-sdk/s3-request-presigner').getSignedUrl;
    } catch (e) {
      // optional - signed URL support won't be available without this package
      S3_PRESIGNER = null;
    }
  } catch (e) {
    logger.warn('AWS SDK not available - falling back to local disk storage');
    s3Client = null;
  }
}

const S3_ENABLED = !!(s3Client && process.env.AWS_S3_BUCKET);

async function uploadToS3(localFilePath, destKey, contentType) {
  const fsPromises = fs.promises;
  try {
    const fileBuffer = await fsPromises.readFile(localFilePath);
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
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

    // Default S3 virtual-hosted style
    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${process.env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${destKey}`;
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

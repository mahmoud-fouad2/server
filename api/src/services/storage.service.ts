import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

class StorageService {
  private s3: AWS.S3 | null = null;
  private bucketName: string = '';
  private useS3: boolean = false;

  constructor() {
    this.initializeS3();
  }

  private initializeS3() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.AWS_S3_BUCKET || '';

    if (accessKeyId && secretAccessKey && this.bucketName) {
      this.s3 = new AWS.S3({
        accessKeyId,
        secretAccessKey,
        region,
      });

      this.useS3 = true;
      logger.info('✅ S3 storage initialized');
    } else {
      logger.warn('S3 not configured, using local storage');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<string> {
    if (this.useS3 && this.s3) {
      return this.uploadToS3(file, folder);
    } else {
      return this.uploadToLocal(file, folder);
    }
  }

  private async uploadToS3(
    file: Express.Multer.File,
    folder: string
  ): Promise<string> {
    try {
      const fileName = `${folder}/${Date.now()}-${file.originalname}`;

      const params = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer || fs.readFileSync(file.path),
        ContentType: file.mimetype,
        ACL: 'public-read',
      };

      const result = await this.s3!.upload(params).promise();
      logger.info(`File uploaded to S3: ${result.Location}`);

      // Clean up local file if it exists
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return result.Location;
    } catch (error: any) {
      logger.error('S3 upload failed:', error.message);
      // Fallback to local storage
      return this.uploadToLocal(file, folder);
    }
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    folder: string
  ): Promise<string> {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', folder);

      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadDir, fileName);

      // Move or copy file
      if (file.path) {
        fs.renameSync(file.path, filePath);
      } else if (file.buffer) {
        fs.writeFileSync(filePath, file.buffer);
      }

      const publicUrl = `/uploads/${folder}/${fileName}`;
      logger.info(`File uploaded locally: ${publicUrl}`);

      return publicUrl;
    } catch (error: any) {
      logger.error('Local upload failed:', error.message);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (this.useS3 && fileUrl.includes('amazonaws.com')) {
        return this.deleteFromS3(fileUrl);
      } else {
        return this.deleteFromLocal(fileUrl);
      }
    } catch (error: any) {
      logger.error('File deletion failed:', error.message);
      return false;
    }
  }

  private async deleteFromS3(fileUrl: string): Promise<boolean> {
    try {
      const key = fileUrl.split('.com/')[1];

      await this.s3!.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise();

      logger.info(`File deleted from S3: ${key}`);
      return true;
    } catch (error: any) {
      logger.error('S3 deletion failed:', error.message);
      return false;
    }
  }

  private async deleteFromLocal(fileUrl: string): Promise<boolean> {
    try {
      const filePath = path.join(process.cwd(), fileUrl);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`File deleted locally: ${filePath}`);
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Local deletion failed:', error.message);
      return false;
    }
  }

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.useS3 && this.s3) {
      return this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      });
    }

    return `/uploads/${key}`;
  }

  isS3Configured(): boolean {
    return this.useS3;
  }
}

export default new StorageService();

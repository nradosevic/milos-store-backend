import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('S3_BUCKET', 'milos-store-uploads');
    this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL', 'http://localhost:9000/milos-store-uploads');
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('S3_ENDPOINT', 'http://localhost:9000'),
      region: this.configService.get<string>('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return key;
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  async uploadProductImage(
    productId: number,
    file: Express.Multer.File,
  ): Promise<{ s3Key: string; thumbnailS3Key: string }> {
    const timestamp = Date.now();
    const ext = 'jpg';
    const s3Key = `products/${productId}/${timestamp}.${ext}`;
    const thumbnailS3Key = `products/${productId}/${timestamp}_thumb.${ext}`;

    const originalBuffer = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const thumbnailBuffer = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    await this.uploadFile(originalBuffer, s3Key, 'image/jpeg');
    await this.uploadFile(thumbnailBuffer, thumbnailS3Key, 'image/jpeg');

    return { s3Key, thumbnailS3Key };
  }
}

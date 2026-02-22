import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

export const createS3Client = (configService: ConfigService): S3Client => {
  return new S3Client({
    endpoint: configService.get<string>('S3_ENDPOINT'),
    region: configService.get<string>('S3_REGION', 'us-east-1'),
    credentials: {
      accessKeyId: configService.get<string>('S3_ACCESS_KEY', 'minioadmin'),
      secretAccessKey: configService.get<string>('S3_SECRET_KEY', 'minioadmin'),
    },
    forcePathStyle: true,
  });
};

import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
export declare const createS3Client: (configService: ConfigService) => S3Client;

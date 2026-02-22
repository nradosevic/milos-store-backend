import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private configService;
    private s3Client;
    private bucket;
    private publicUrl;
    constructor(configService: ConfigService);
    uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string>;
    deleteFile(key: string): Promise<void>;
    getPublicUrl(key: string): string;
    uploadProductImage(productId: number, file: Express.Multer.File): Promise<{
        s3Key: string;
        thumbnailS3Key: string;
    }>;
}

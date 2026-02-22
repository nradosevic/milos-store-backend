"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const sharp = require("sharp");
let UploadService = class UploadService {
    constructor(configService) {
        this.configService = configService;
        this.bucket = this.configService.get('S3_BUCKET', 'milos-store-uploads');
        this.publicUrl = this.configService.get('S3_PUBLIC_URL', 'http://localhost:9000/milos-store-uploads');
        this.s3Client = new client_s3_1.S3Client({
            endpoint: this.configService.get('S3_ENDPOINT', 'http://localhost:9000'),
            region: this.configService.get('S3_REGION', 'us-east-1'),
            credentials: {
                accessKeyId: this.configService.get('S3_ACCESS_KEY', 'minioadmin'),
                secretAccessKey: this.configService.get('S3_SECRET_KEY', 'minioadmin'),
            },
            forcePathStyle: true,
        });
    }
    async uploadFile(buffer, key, contentType) {
        await this.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        }));
        return key;
    }
    async deleteFile(key) {
        await this.s3Client.send(new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
    }
    getPublicUrl(key) {
        return `${this.publicUrl}/${key}`;
    }
    async uploadProductImage(productId, file) {
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
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map
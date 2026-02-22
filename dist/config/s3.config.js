"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createS3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const createS3Client = (configService) => {
    return new client_s3_1.S3Client({
        endpoint: configService.get('S3_ENDPOINT'),
        region: configService.get('S3_REGION', 'us-east-1'),
        credentials: {
            accessKeyId: configService.get('S3_ACCESS_KEY', 'minioadmin'),
            secretAccessKey: configService.get('S3_SECRET_KEY', 'minioadmin'),
        },
        forcePathStyle: true,
    });
};
exports.createS3Client = createS3Client;
//# sourceMappingURL=s3.config.js.map
import { registerAs } from "@nestjs/config";

export default registerAs("minio", () => ({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === "true" || false,
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
    bucketName: process.env.MINIO_BUCKET_NAME || "uploads",
    thumbnailBucket: process.env.MINIO_THUMBNAIL_BUCKET || "thumbnails",
    region: process.env.MINIO_REGION || "us-east-1",
}));

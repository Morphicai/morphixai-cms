#!/bin/sh

# MinIO 初始化脚本
# 用于自动创建存储桶并设置权限

set -e

echo "Starting MinIO initialization..."

# 等待 MinIO 服务就绪
echo "Waiting for MinIO to be ready..."
until /usr/bin/mc alias set minio http://minio:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY; do
    echo "MinIO not ready, waiting..."
    sleep 2
done

echo "MinIO is ready. Creating buckets..."

# 创建主要存储桶
echo "Creating bucket: $MINIO_BUCKET_NAME"
/usr/bin/mc mb minio/$MINIO_BUCKET_NAME --ignore-existing

# 创建缩略图存储桶
echo "Creating thumbnail bucket: $MINIO_THUMBNAIL_BUCKET"
/usr/bin/mc mb minio/$MINIO_THUMBNAIL_BUCKET --ignore-existing

# 设置存储桶为公共读取权限
echo "Setting public read policy for bucket: $MINIO_BUCKET_NAME"
/usr/bin/mc policy set public minio/$MINIO_BUCKET_NAME

echo "Setting public read policy for thumbnail bucket: $MINIO_THUMBNAIL_BUCKET"
/usr/bin/mc policy set public minio/$MINIO_THUMBNAIL_BUCKET

# 创建开发环境测试目录结构
echo "Creating development directory structure..."
/usr/bin/mc mb minio/$MINIO_BUCKET_NAME/documents --ignore-existing
/usr/bin/mc mb minio/$MINIO_BUCKET_NAME/images --ignore-existing
/usr/bin/mc mb minio/$MINIO_BUCKET_NAME/videos --ignore-existing
/usr/bin/mc mb minio/$MINIO_BUCKET_NAME/others --ignore-existing

# 显示存储桶列表
echo "Listing created buckets:"
/usr/bin/mc ls minio/

echo "MinIO initialization completed successfully!"

exit 0
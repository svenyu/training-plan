import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const useSSL = config.get('MINIO_USE_SSL', 'false') === 'true';
    this.client = new Minio.Client({
      endPoint: config.get('MINIO_ENDPOINT', 'localhost'),
      port: Number(config.get('MINIO_PORT', 9000)),
      useSSL,
      accessKey: config.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: config.get('MINIO_SECRET_KEY', 'minioadmin'),
    });
    this.bucket = config.get('MINIO_BUCKET', 'spine-train');
    this.publicUrl = config.get('MINIO_PUBLIC_URL', 'http://localhost:9000/spine-train');
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      this.logger.log(`已创建 MinIO 桶: ${this.bucket}`);
    }
  }

  /** 生成对象键（avatars/{userId}/uuid.ext 或 videos/...） */
  buildObjectKey(userId: bigint, filename: string, contentType: string) {
    const isImage = contentType.startsWith('image/');
    const defaultExt = isImage ? 'jpg' : 'mp4';
    const ext = filename.includes('.') ? filename.split('.').pop() : defaultExt;
    const folder = isImage ? 'avatars' : 'videos';
    return `${folder}/${userId}/${uuidv4()}.${ext}`;
  }

  /** 后端代收文件并写入 MinIO */
  async uploadObject(
    userId: bigint,
    buffer: Buffer,
    filename: string,
    contentType = 'application/octet-stream',
  ) {
    const objectKey = this.buildObjectKey(userId, filename, contentType);
    await this.client.putObject(this.bucket, objectKey, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    const playUrl = `${this.publicUrl}/${objectKey}`;
    const isImage = contentType.startsWith('image/');
    return {
      objectKey,
      playUrl,
      contentType,
      publicUrl: isImage ? playUrl : undefined,
    };
  }

  /** 生成上传预签名 URL 与对象键 */
  async presignVideo(userId: bigint, filename: string, contentType = 'video/mp4') {
    return this.presignUpload(userId, filename, contentType);
  }

  /** 按内容类型生成预签名（视频存 objectKey，图片返回可访问 URL） */
  async presignUpload(userId: bigint, filename: string, contentType = 'application/octet-stream') {
    const objectKey = this.buildObjectKey(userId, filename, contentType);
    const uploadUrl = await this.client.presignedPutObject(
      this.bucket,
      objectKey,
      60 * 60,
    );
    const playUrl = `${this.publicUrl}/${objectKey}`;
    const isImage = contentType.startsWith('image/');
    return {
      uploadUrl,
      objectKey,
      playUrl,
      contentType,
      /** 头像等图片场景直接使用公网 URL */
      publicUrl: isImage ? playUrl : undefined,
    };
  }

  /** 对象键转可播放地址 */
  toPlayUrl(objectKey: string) {
    if (objectKey.startsWith('http')) {
      return objectKey;
    }
    return `${this.publicUrl}/${objectKey}`;
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ok } from '../common/response';
import { MinioService } from './minio.service';

class PresignDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsOptional()
  @IsString()
  contentType?: string;
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly minio: MinioService) {}

  @Post('presign')
  async presign(@CurrentUser() user: { userId: bigint }, @Body() dto: PresignDto) {
    const data = await this.minio.presignVideo(
      user.userId,
      dto.filename,
      dto.contentType ?? 'video/mp4',
    );
    return ok(data);
  }

  /** 小程序 multipart 上传到后端，再由后端写入 MinIO */
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @CurrentUser() user: { userId: bigint },
    @UploadedFile() file: Express.Multer.File,
    @Body('contentType') contentType?: string,
    @Body('filename') filename?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('请选择要上传的文件');
    }
    const mime = contentType || file.mimetype || 'application/octet-stream';
    const name = filename || file.originalname || 'file';
    const data = await this.minio.uploadObject(user.userId, file.buffer, name, mime);
    return ok(data);
  }
}

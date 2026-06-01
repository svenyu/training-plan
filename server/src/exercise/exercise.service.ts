import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/serialize';
import { MinioService } from '../upload/minio.service';

@Injectable()
export class ExerciseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  private mapExercise(row: {
    id: bigint;
    name: string;
    category: string;
    description: string | null;
    videoUrl: string | null;
    status: number;
    createdAt: Date;
  }) {
    return {
      ...row,
      videoPlayUrl: row.videoUrl ? this.minio.toPlayUrl(row.videoUrl) : null,
    };
  }

  async list(userId: bigint, keyword?: string) {
    const list = await this.prisma.exercise.findMany({
      where: {
        userId,
        isDeleted: false,
        ...(keyword ? { name: { contains: keyword } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return serialize(list.map((e) => this.mapExercise(e)));
  }

  async get(userId: bigint, id: bigint) {
    const row = await this.findOwned(userId, id);
    return serialize(this.mapExercise(row));
  }

  async create(
    userId: bigint,
    data: {
      name: string;
      category?: string;
      description?: string;
      videoUrl?: string;
      status?: number;
    },
  ) {
    const row = await this.prisma.exercise.create({
      data: {
        userId,
        name: data.name,
        category: data.category ?? 'main',
        description: data.description,
        videoUrl: data.videoUrl,
        status: data.status ?? 1,
      },
    });
    return serialize(this.mapExercise(row));
  }

  async update(
    userId: bigint,
    id: bigint,
    data: Partial<{ name: string; category: string; description: string; videoUrl: string; status: number }>,
  ) {
    await this.findOwned(userId, id);
    const row = await this.prisma.exercise.update({ where: { id }, data });
    return serialize(this.mapExercise(row));
  }

  async remove(userId: bigint, id: bigint) {
    await this.findOwned(userId, id);
    await this.prisma.exercise.update({
      where: { id },
      data: { isDeleted: true, status: 0 },
    });
    return { success: true };
  }

  private async findOwned(userId: bigint, id: bigint) {
    const row = await this.prisma.exercise.findFirst({
      where: { id, userId, isDeleted: false },
    });
    if (!row) {
      throw new NotFoundException('动作不存在');
    }
    return row;
  }
}

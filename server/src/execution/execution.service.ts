import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/serialize';
import { MinioService } from '../upload/minio.service';

const RATINGS = ['excellent', 'good', 'fair', 'poor', 'bad'] as const;

@Injectable()
export class ExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  /** 开始训练：同计划同日若有进行中会话则继续，否则新建（允许多次完成，进度按 trainDate 去重） */
  async start(userId: bigint, planId: bigint) {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { id: planId, userId, status: 'active' },
      include: { exercises: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!plan || plan.exercises.length === 0) {
      throw new BadRequestException('计划不存在、未配置动作或已结束');
    }

    const today = this.todayDate();
    await this.ensurePlanInPeriod(planId, plan, today);

    const inProgress = await this.prisma.planExecution.findFirst({
      where: { planId, userId, trainDate: today, status: 'in_progress' },
      orderBy: { startedAt: 'desc' },
    });
    if (inProgress) {
      return this.get(userId, inProgress.id);
    }

  // days 模式：首次开练写入 start_date
    if (plan.timeMode === 'days' && !plan.startDate) {
      const end = new Date(today);
      end.setDate(end.getDate() + (plan.totalDays ?? 1) - 1);
      await this.prisma.trainingPlan.update({
        where: { id: planId },
        data: { startDate: today, endDate: end },
      });
    }

    const execution = await this.prisma.planExecution.create({
      data: {
        planId,
        userId,
        trainDate: today,
        status: 'in_progress',
        items: {
          create: plan.exercises.map((pe) => ({
            planExerciseId: pe.id,
            exerciseId: pe.exerciseId,
            sortOrder: pe.sortOrder,
            status: 'pending',
          })),
        },
      },
    });

    return this.get(userId, execution.id);
  }

  async get(userId: bigint, id: bigint) {
    const exec = await this.prisma.planExecution.findFirst({
      where: { id, userId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            exercise: true,
            planExercise: true,
          },
        },
        plan: true,
      },
    });
    if (!exec) {
      throw new NotFoundException('训练记录不存在');
    }
    return serialize({
      ...exec,
      items: exec.items.map((item) => ({
        ...item,
        exercise: {
          ...item.exercise,
          videoPlayUrl: item.exercise.videoUrl
            ? this.minio.toPlayUrl(item.exercise.videoUrl)
            : null,
        },
        setsDesc: item.planExercise.setsDesc,
      })),
    });
  }

  async updateItem(
    userId: bigint,
    executionId: bigint,
    itemId: bigint,
    data: { qualityRating?: string; status?: string; skipReason?: string },
  ) {
    const exec = await this.prisma.planExecution.findFirst({
      where: { id: executionId, userId, status: 'in_progress' },
    });
    if (!exec) {
      throw new NotFoundException('进行中的训练不存在');
    }

    if (data.qualityRating && !RATINGS.includes(data.qualityRating as (typeof RATINGS)[number])) {
      throw new BadRequestException('无效评分');
    }

    const status = data.status ?? (data.qualityRating ? 'done' : undefined);
    await this.prisma.executionItem.update({
      where: { id: itemId, executionId },
      data: {
        qualityRating: data.qualityRating,
        status,
        skipReason: data.skipReason,
        completedAt: status && status !== 'pending' ? new Date() : undefined,
      },
    });
    return this.get(userId, executionId);
  }

  async complete(userId: bigint, executionId: bigint) {
    const exec = await this.prisma.planExecution.findFirst({
      where: { id: executionId, userId, status: 'in_progress' },
      include: { items: true },
    });
    if (!exec) {
      throw new NotFoundException('进行中的训练不存在');
    }

    const pending = exec.items.some((i) => i.status === 'pending');
    if (pending) {
      throw new BadRequestException('仍有未完成动作');
    }

    await this.prisma.planExecution.update({
      where: { id: executionId },
      data: { status: 'completed', endedAt: new Date() },
    });

    return this.get(userId, executionId);
  }

  async list(userId: bigint, planId?: bigint) {
    const list = await this.prisma.planExecution.findMany({
      where: { userId, ...(planId ? { planId } : {}) },
      orderBy: { startedAt: 'desc' },
      include: { plan: { select: { id: true, name: true } } },
    });
    return serialize(list);
  }

  private todayDate() {
    const d = new Date();
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  private async ensurePlanInPeriod(
    planId: bigint,
    plan: {
      timeMode: string;
      totalDays: number | null;
      startDate: Date | null;
      endDate: Date | null;
    },
    today: Date,
  ) {
    if (plan.timeMode === 'range') {
      if (!plan.startDate || !plan.endDate) {
        throw new BadRequestException('计划日期未配置');
      }
      if (today < plan.startDate || today > plan.endDate) {
        throw new BadRequestException('不在计划日期范围内');
      }
    } else if (plan.startDate && plan.endDate) {
      if (today > plan.endDate) {
        await this.prisma.trainingPlan.update({
          where: { id: planId },
          data: { status: 'finished' },
        });
        throw new BadRequestException('计划已到期');
      }
    }
  }
}

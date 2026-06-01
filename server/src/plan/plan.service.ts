import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/serialize';
import { MinioService } from '../upload/minio.service';

export interface PlanExerciseInput {
  exerciseId: string;
  sortOrder: number;
  setsDesc?: string;
}

@Injectable()
export class PlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async list(userId: bigint) {
    const plans = await this.prisma.trainingPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        exercises: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    const progressMap = await this.buildProgressMap(
      userId,
      plans.map((p) => p.id),
    );
    return serialize(
      plans.map((p) => this.mapPlan(p, progressMap.get(String(p.id)))),
    );
  }

  async get(userId: bigint, id: bigint) {
    const plan = await this.findOwned(userId, id);
    const progressMap = await this.buildProgressMap(userId, [id]);
    return serialize(this.mapPlan(plan, progressMap.get(String(id))));
  }

  async create(
    userId: bigint,
    data: {
      name: string;
      description?: string;
      timeMode: 'days' | 'range';
      totalDays?: number;
      startDate?: string;
      endDate?: string;
      exercises?: PlanExerciseInput[];
    },
  ) {
    this.validateTime(data);
    const plan = await this.prisma.trainingPlan.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        timeMode: data.timeMode,
        totalDays: data.timeMode === 'days' ? data.totalDays : null,
        startDate: data.timeMode === 'range' && data.startDate ? new Date(data.startDate) : null,
        endDate: data.timeMode === 'range' && data.endDate ? new Date(data.endDate) : null,
      },
    });
    if (data.exercises?.length) {
      await this.replaceExercises(plan.id, userId, data.exercises);
    }
    return this.get(userId, plan.id);
  }

  async update(
    userId: bigint,
    id: bigint,
    data: Partial<{
      name: string;
      description: string;
      timeMode: 'days' | 'range';
      totalDays: number;
      startDate: string;
      endDate: string;
      status: string;
    }>,
  ) {
    await this.findOwned(userId, id);
    if (data.timeMode) {
      this.validateTime({
        timeMode: data.timeMode,
        totalDays: data.totalDays,
        startDate: data.startDate,
        endDate: data.endDate,
      });
    }
    await this.prisma.trainingPlan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        timeMode: data.timeMode,
        totalDays: data.totalDays,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
      },
    });
    return this.get(userId, id);
  }

  async replaceExercises(planId: bigint, userId: bigint, items: PlanExerciseInput[]) {
    await this.findOwned(userId, planId);
    const exerciseIds = items.map((i) => BigInt(i.exerciseId));
    const count = await this.prisma.exercise.count({
      where: { id: { in: exerciseIds }, userId, isDeleted: false, status: 1 },
    });
    if (count !== exerciseIds.length) {
      throw new BadRequestException('包含无效或已停用的动作');
    }

    await this.prisma.$transaction([
      this.prisma.planExercise.deleteMany({ where: { planId } }),
      this.prisma.planExercise.createMany({
        data: items.map((i) => ({
          planId,
          exerciseId: BigInt(i.exerciseId),
          sortOrder: i.sortOrder,
          setsDesc: i.setsDesc,
        })),
      }),
    ]);
    return this.get(userId, planId);
  }

  async remove(userId: bigint, id: bigint) {
    await this.findOwned(userId, id);
    // 先删训练记录（含 execution_item），再删计划；plan_exercise 随计划级联删除
    await this.prisma.$transaction([
      this.prisma.planExecution.deleteMany({ where: { planId: id } }),
      this.prisma.trainingPlan.delete({ where: { id } }),
    ]);
    return { success: true };
  }

  private validateTime(data: {
    timeMode: string;
    totalDays?: number;
    startDate?: string;
    endDate?: string;
  }) {
    if (data.timeMode === 'days') {
      if (!data.totalDays || data.totalDays < 1) {
        throw new BadRequestException('天数模式需填写 totalDays');
      }
    } else if (data.timeMode === 'range') {
      if (!data.startDate || !data.endDate) {
        throw new BadRequestException('日期范围模式需填写 startDate 与 endDate');
      }
    } else {
      throw new BadRequestException('timeMode 仅支持 days 或 range');
    }
  }

  /** 按计划统计：有训练记录的不同日期数（当天练过即 +1 天） */
  private async buildProgressMap(userId: bigint, planIds: bigint[]) {
    const map = new Map<
      string,
      { trainedDays: number; weeklyTrainedDays: number }
    >();
    if (!planIds.length) return map;

    for (const id of planIds) {
      map.set(String(id), { trainedDays: 0, weeklyTrainedDays: 0 });
    }

    const executions = await this.prisma.planExecution.findMany({
      where: { userId, planId: { in: planIds } },
      select: { planId: true, trainDate: true },
    });

    const { start: weekStart, end: weekEnd } = this.getWeekBounds();
    const allDates = new Map<string, Set<string>>();
    const weekDates = new Map<string, Set<string>>();

    for (const e of executions) {
      const pid = String(e.planId);
      const ds = this.formatTrainDate(e.trainDate);
      if (!allDates.has(pid)) allDates.set(pid, new Set());
      allDates.get(pid)!.add(ds);
      if (this.isDateInRange(e.trainDate, weekStart, weekEnd)) {
        if (!weekDates.has(pid)) weekDates.set(pid, new Set());
        weekDates.get(pid)!.add(ds);
      }
    }

    for (const id of planIds) {
      const key = String(id);
      map.set(key, {
        trainedDays: allDates.get(key)?.size ?? 0,
        weeklyTrainedDays: weekDates.get(key)?.size ?? 0,
      });
    }
    return map;
  }

  private getTotalPlanDays(plan: {
    timeMode: string;
    totalDays: number | null;
    startDate: Date | null;
    endDate: Date | null;
  }) {
    if (plan.timeMode === 'range' && plan.startDate && plan.endDate) {
      const start = new Date(plan.startDate);
      const end = new Date(plan.endDate);
      const diff = Math.floor(
        (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
      );
      return Math.max(1, diff + 1);
    }
    return plan.totalDays ?? 21;
  }

  private calcProgressPercent(
    plan: { status: string },
    trainedDays: number,
    totalPlanDays: number,
  ) {
    if (plan.status === 'finished') return 100;
    if (totalPlanDays <= 0) return 0;
    return Math.min(100, Math.round((trainedDays / totalPlanDays) * 100));
  }

  private formatTrainDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private getWeekBounds() {
    const now = new Date();
    const weekday = now.getDay();
    const diffToMonday = weekday === 0 ? 6 : weekday - 1;
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - diffToMonday,
    );
    const end = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + 6,
    );
    return { start, end };
  }

  private isDateInRange(d: Date, start: Date, end: Date) {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return t >= start.getTime() && t <= end.getTime();
  }

  private mapPlan(
    plan: {
      id: bigint;
      name: string;
      description: string | null;
      timeMode: string;
      totalDays: number | null;
      startDate: Date | null;
      endDate: Date | null;
      status: string;
      exercises: Array<{
        id: bigint;
        sortOrder: number;
        setsDesc: string | null;
        exercise: {
          id: bigint;
          name: string;
          videoUrl: string | null;
          category: string;
        };
      }>;
    },
    progress?: { trainedDays: number; weeklyTrainedDays: number },
  ) {
    const trainedDays = progress?.trainedDays ?? 0;
    const weeklyTrainedDays = progress?.weeklyTrainedDays ?? 0;
    const totalPlanDays = this.getTotalPlanDays(plan);
    const progressPercent = this.calcProgressPercent(
      plan,
      trainedDays,
      totalPlanDays,
    );

    return {
      ...plan,
      trainedDays,
      totalPlanDays,
      progressPercent,
      weeklyTrainedDays,
      currentDay: trainedDays,
      exercises: plan.exercises.map((pe) => ({
        id: pe.id,
        sortOrder: pe.sortOrder,
        setsDesc: pe.setsDesc,
        exercise: {
          ...pe.exercise,
          videoPlayUrl: pe.exercise.videoUrl
            ? this.minio.toPlayUrl(pe.exercise.videoUrl)
            : null,
        },
      })),
    };
  }

  private async findOwned(userId: bigint, id: bigint) {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { id, userId },
      include: {
        exercises: { include: { exercise: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!plan) {
      throw new NotFoundException('计划不存在');
    }
    return plan;
  }
}

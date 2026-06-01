import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WechatService } from '../auth/wechat.service';

@Injectable()
export class RemindService {
  private readonly logger = new Logger(RemindService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wechat: WechatService,
    private readonly config: ConfigService,
  ) {}

  /** 每分钟检查是否到提醒时刻（remindTime 格式 HH:mm） */
  @Cron('* * * * *')
  async sendDailyReminders() {
    const templateId = this.config.get<string>('WECHAT_SUBSCRIBE_TEMPLATE_ID');
    if (!templateId) {
      return;
    }

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const slot = `${hh}:${mm}`;

    const users = await this.prisma.user.findMany({
      where: {
        remindEnabled: true,
        remindTime: slot,
        subscribeQuota: { gt: 0 },
      },
    });

    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    for (const user of users) {
      try {
        const hasActivePlan = await this.prisma.trainingPlan.count({
          where: { userId: user.id, status: 'active' },
        });
        if (!hasActivePlan) {
          continue;
        }

        const doneToday = await this.prisma.planExecution.count({
          where: {
            userId: user.id,
            trainDate: today,
            status: 'completed',
          },
        });
        if (doneToday > 0) {
          continue;
        }

        // 模板「打卡提醒」：thing1 打卡主题、date2 打卡时间、thing5 打卡备注
        const y = now.getFullYear();
        const mo = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        await this.wechat.sendSubscribeMessage({
          openid: user.openid,
          templateId,
          page: 'pages/home/index',
          data: {
            thing1: { value: '今日康复训练' },
            date2: { value: `${y}-${mo}-${d} ${hh}:${mm}` },
            thing5: { value: '记得带孩子完成训练哦' },
          },
        });

        await this.prisma.user.update({
          where: { id: user.id },
          data: { subscribeQuota: { decrement: 1 } },
        });
        await this.prisma.subscribeLog.create({
          data: { userId: user.id, action: 'send', result: 'ok' },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(`提醒发送失败 user=${user.id}: ${msg}`);
        await this.prisma.subscribeLog.create({
          data: { userId: user.id, action: 'send', result: msg },
        });
      }
    }
  }
}

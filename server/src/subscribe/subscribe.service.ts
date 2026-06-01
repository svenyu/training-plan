import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/serialize';

@Injectable()
export class SubscribeService {
  constructor(private readonly prisma: PrismaService) {}

  /** 用户在小程序 requestSubscribeMessage 同意后调用，额度 +1 */
  async confirm(userId: bigint) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { subscribeQuota: { increment: 1 } },
    });
    await this.prisma.subscribeLog.create({
      data: { userId, action: 'authorize', result: 'quota+1' },
    });
    return serialize({ subscribeQuota: user.subscribeQuota });
  }
}

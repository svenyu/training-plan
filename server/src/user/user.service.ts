import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/serialize';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async updateRemind(userId: bigint, enabled: boolean, remindTime?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { remindEnabled: enabled, remindTime: remindTime ?? undefined },
    });
    return serialize({
      remindEnabled: user.remindEnabled,
      remindTime: user.remindTime,
      subscribeQuota: user.subscribeQuota,
    });
  }

  async subscribeStatus(userId: bigint) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return serialize({
      remindEnabled: user.remindEnabled,
      remindTime: user.remindTime,
      subscribeQuota: user.subscribeQuota,
    });
  }
}

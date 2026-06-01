import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/serialize';
import { WechatService } from './wechat.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wechat: WechatService,
    private readonly jwt: JwtService,
  ) {}

  async loginByWechat(code: string, nickname?: string, avatarUrl?: string) {
    const { openid } = await this.wechat.code2Session(code);

    let user = await this.prisma.user.findUnique({ where: { openid } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { openid, nickname, avatarUrl },
      });
    } else if (nickname !== undefined || avatarUrl !== undefined) {
      user = await this.applyProfileUpdate(user, nickname, avatarUrl);
    }

    const token = this.jwt.sign({ sub: user.id.toString(), openid });
    return this.buildAuthResult(token, user);
  }

  /** 已登录用户更新微信昵称、头像 */
  async updateProfile(userId: bigint, nickname?: string, avatarUrl?: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const updated = await this.applyProfileUpdate(user, nickname, avatarUrl);
    return this.toUserProfile(updated);
  }

  async getProfile(userId: bigint) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toUserProfile(user);
  }

  private async applyProfileUpdate(user: User, nickname?: string, avatarUrl?: string) {
    const data: { nickname?: string; avatarUrl?: string } = {};
    if (nickname !== undefined && nickname !== user.nickname) {
      data.nickname = nickname;
    }
    if (avatarUrl !== undefined && avatarUrl !== user.avatarUrl) {
      data.avatarUrl = avatarUrl;
    }
    if (!Object.keys(data).length) {
      return user;
    }
    return this.prisma.user.update({ where: { id: user.id }, data });
  }

  private toUserProfile(user: User) {
    return serialize({
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      remindEnabled: user.remindEnabled,
      remindTime: user.remindTime,
      subscribeQuota: user.subscribeQuota,
    });
  }

  private buildAuthResult(token: string, user: User) {
    return serialize({
      accessToken: token,
      user: this.toUserProfile(user),
    });
  }
}

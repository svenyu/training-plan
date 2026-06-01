import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface Code2SessionResult {
  openid?: string;
  session_key?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class WechatService {
  constructor(private readonly config: ConfigService) {}

  /** 用 wx.login 的 code 换取 openid */
  async code2Session(code: string): Promise<{ openid: string; sessionKey: string }> {
    const appid = this.config.get<string>('WECHAT_APPID');
    const secret = this.config.get<string>('WECHAT_SECRET');
    if (!appid || !secret) {
      throw new UnauthorizedException('未配置 WECHAT_APPID / WECHAT_SECRET');
    }

    const { data } = await axios.get<Code2SessionResult>(
      'https://api.weixin.qq.com/sns/jscode2session',
      {
        params: { appid, secret, js_code: code, grant_type: 'authorization_code' },
      },
    );

    if (data.errcode || !data.openid) {
      throw new UnauthorizedException(data.errmsg ?? '微信登录失败');
    }

    return { openid: data.openid, sessionKey: data.session_key ?? '' };
  }

  /** 发送一次性订阅消息 */
  async sendSubscribeMessage(params: {
    openid: string;
    templateId: string;
    page: string;
    data: Record<string, { value: string }>;
  }): Promise<void> {
    const accessToken = await this.getAccessToken();
    const { data } = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
      {
        touser: params.openid,
        template_id: params.templateId,
        page: params.page,
        data: params.data,
        miniprogram_state: 'formal',
      },
    );
    if (data.errcode !== 0) {
      throw new Error(data.errmsg ?? `subscribe send failed: ${data.errcode}`);
    }
  }

  private accessTokenCache: { token: string; expireAt: number } | null = null;

  private async getAccessToken(): Promise<string> {
    if (this.accessTokenCache && Date.now() < this.accessTokenCache.expireAt) {
      return this.accessTokenCache.token;
    }
    const appid = this.config.get<string>('WECHAT_APPID');
    const secret = this.config.get<string>('WECHAT_SECRET');
    const { data } = await axios.get<{ access_token: string; expires_in: number; errcode?: number }>(
      'https://api.weixin.qq.com/cgi-bin/token',
      { params: { grant_type: 'client_credential', appid, secret } },
    );
    if (!data.access_token) {
      throw new Error('获取 access_token 失败');
    }
    this.accessTokenCache = {
      token: data.access_token,
      expireAt: Date.now() + (data.expires_in - 300) * 1000,
    };
    return data.access_token;
  }
}

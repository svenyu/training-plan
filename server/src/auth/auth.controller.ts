import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ok } from '../common/response';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

class WechatLoginDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarUrl?: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarUrl?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('wechat')
  async wechatLogin(@Body() dto: WechatLoginDto) {
    const data = await this.auth.loginByWechat(dto.code, dto.nickname, dto.avatarUrl);
    return ok(data);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { userId: bigint }) {
    return ok(await this.auth.getProfile(user.userId));
  }

  /** 同步微信昵称、头像等授权资料 */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: { userId: bigint }, @Body() dto: UpdateProfileDto) {
    return ok(await this.auth.updateProfile(user.userId, dto.nickname, dto.avatarUrl));
  }
}

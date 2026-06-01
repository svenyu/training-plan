import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ok } from '../common/response';
import { UserService } from './user.service';

class UpdateRemindDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  remindTime?: string;
}

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('subscribe-status')
  async subscribeStatus(@CurrentUser() user: { userId: bigint }) {
    return ok(await this.service.subscribeStatus(user.userId));
  }

  @Put('remind')
  async updateRemind(@CurrentUser() user: { userId: bigint }, @Body() dto: UpdateRemindDto) {
    return ok(await this.service.updateRemind(user.userId, dto.enabled, dto.remindTime));
  }
}

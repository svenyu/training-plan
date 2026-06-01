import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ok } from '../common/response';
import { SubscribeService } from './subscribe.service';

@Controller('subscribe')
@UseGuards(JwtAuthGuard)
export class SubscribeController {
  constructor(private readonly service: SubscribeService) {}

  @Post('confirm')
  async confirm(@CurrentUser() user: { userId: bigint }) {
    return ok(await this.service.confirm(user.userId));
  }
}

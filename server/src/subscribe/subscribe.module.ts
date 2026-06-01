import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscribeController } from './subscribe.controller';
import { SubscribeService } from './subscribe.service';

@Module({
  imports: [AuthModule],
  controllers: [SubscribeController],
  providers: [SubscribeService],
})
export class SubscribeModule {}

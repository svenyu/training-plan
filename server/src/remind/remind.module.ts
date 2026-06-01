import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RemindService } from './remind.service';

@Module({
  imports: [AuthModule],
  providers: [RemindService],
})
export class RemindModule {}

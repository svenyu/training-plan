import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { ExerciseModule } from './exercise/exercise.module';
import { ExecutionModule } from './execution/execution.module';
import { PlanModule } from './plan/plan.module';
import { PrismaModule } from './prisma/prisma.module';
import { RemindModule } from './remind/remind.module';
import { SubscribeModule } from './subscribe/subscribe.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    ExerciseModule,
    PlanModule,
    ExecutionModule,
    UploadModule,
    SubscribeModule,
    RemindModule,
  ],
})
export class AppModule {}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ok } from '../common/response';
import { PlanExerciseInput, PlanService } from './plan.service';

class PlanExerciseDto {
  @IsString()
  exerciseId!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;

  @IsOptional()
  @IsString()
  setsDesc?: string;
}

class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['days', 'range'])
  timeMode!: 'days' | 'range';

  @IsOptional()
  @IsInt()
  @Min(1)
  totalDays?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanExerciseDto)
  exercises?: PlanExerciseDto[];
}

class UpdatePlanExercisesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanExerciseDto)
  exercises!: PlanExerciseDto[];
}

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlanController {
  constructor(private readonly service: PlanService) {}

  @Get()
  async list(@CurrentUser() user: { userId: bigint }) {
    return ok(await this.service.list(user.userId));
  }

  @Get(':id')
  async get(@CurrentUser() user: { userId: bigint }, @Param('id') id: string) {
    return ok(await this.service.get(user.userId, BigInt(id)));
  }

  @Post()
  async create(@CurrentUser() user: { userId: bigint }, @Body() dto: CreatePlanDto) {
    return ok(await this.service.create(user.userId, dto));
  }

  @Put(':id/exercises')
  async updateExercises(
    @CurrentUser() user: { userId: bigint },
    @Param('id') id: string,
    @Body() dto: UpdatePlanExercisesDto,
  ) {
    return ok(
      await this.service.replaceExercises(
        BigInt(id),
        user.userId,
        dto.exercises as PlanExerciseInput[],
      ),
    );
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { userId: bigint }, @Param('id') id: string) {
    return ok(await this.service.remove(user.userId, BigInt(id)));
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ok } from '../common/response';
import { ExerciseService } from './exercise.service';

class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;
}

class UpdateExerciseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;
}

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExerciseController {
  constructor(private readonly service: ExerciseService) {}

  @Get()
  async list(@CurrentUser() user: { userId: bigint }, @Query('keyword') keyword?: string) {
    return ok(await this.service.list(user.userId, keyword));
  }

  @Get(':id')
  async get(@CurrentUser() user: { userId: bigint }, @Param('id') id: string) {
    return ok(await this.service.get(user.userId, BigInt(id)));
  }

  @Post()
  async create(@CurrentUser() user: { userId: bigint }, @Body() dto: CreateExerciseDto) {
    return ok(await this.service.create(user.userId, dto));
  }

  @Put(':id')
  async update(
    @CurrentUser() user: { userId: bigint },
    @Param('id') id: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return ok(await this.service.update(user.userId, BigInt(id), dto));
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { userId: bigint }, @Param('id') id: string) {
    return ok(await this.service.remove(user.userId, BigInt(id)));
  }
}

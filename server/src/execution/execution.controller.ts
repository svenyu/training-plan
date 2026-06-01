import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ok } from '../common/response';
import { ExecutionService } from './execution.service';

class StartExecutionDto {
  @IsString()
  @IsNotEmpty()
  planId!: string;
}

class UpdateItemDto {
  @IsOptional()
  @IsIn(['excellent', 'good', 'fair', 'poor', 'bad'])
  qualityRating?: string;

  @IsOptional()
  @IsIn(['done', 'skipped'])
  status?: string;

  @IsOptional()
  @IsString()
  skipReason?: string;
}

@Controller('executions')
@UseGuards(JwtAuthGuard)
export class ExecutionController {
  constructor(private readonly service: ExecutionService) {}

  @Get()
  async list(
    @CurrentUser() user: { userId: bigint },
    @Query('planId') planId?: string,
  ) {
    return ok(
      await this.service.list(user.userId, planId ? BigInt(planId) : undefined),
    );
  }

  @Get(':id')
  async get(@CurrentUser() user: { userId: bigint }, @Param('id') id: string) {
    return ok(await this.service.get(user.userId, BigInt(id)));
  }

  @Post()
  async start(@CurrentUser() user: { userId: bigint }, @Body() dto: StartExecutionDto) {
    return ok(await this.service.start(user.userId, BigInt(dto.planId)));
  }

  @Patch(':id/items/:itemId')
  async updateItem(
    @CurrentUser() user: { userId: bigint },
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return ok(
      await this.service.updateItem(user.userId, BigInt(id), BigInt(itemId), dto),
    );
  }

  @Post(':id/complete')
  async complete(@CurrentUser() user: { userId: bigint }, @Param('id') id: string) {
    return ok(await this.service.complete(user.userId, BigInt(id)));
  }
}

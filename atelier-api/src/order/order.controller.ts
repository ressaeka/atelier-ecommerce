import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { OrderService } from './order.service.js';

import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order.dto.js';

import {
  OrderQueryDto,
  OrderQuerySchema,
} from './dto/query-order.dto.js';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: { id: number },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.create(
      createOrderDto,
      user.id,
    );
  }

  @Get()
  async findAll(
    @Query(
      new ZodValidationPipe(OrderQuerySchema),
    )
    query: OrderQueryDto,
  ) {
    return this.orderService.findAllOrder(query);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { id: number },
    @Param('id') id: string,
  ) {
    return this.orderService.findOrderByIdAndUserId(
      user.id,
      +id,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(
      +id,
      updateOrderStatusDto,
    );
  }
}
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

import {
  UpdateOrderStatusSchema,
  UpdateOrderStatusDto,
} from './dto/update-order.dto.js';

import { OrderQueryDto, OrderQuerySchema } from './dto/query-order.dto.js';

import { RolesGuard } from '../common/guards/roles.guard.js';

import { PermissionsGuard } from '../common/guards/permissions.guard.js';

import { Roles } from '../common/decorators/roles.decorator.js';

import { Permissions } from '../common/decorators/permissions.decorator.js';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(
    @CurrentUser() user: { id: number },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.create(createOrderDto, user.id);
  }

  @Get()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions('order:read')
  async findAll(
    @Query(new ZodValidationPipe(OrderQuerySchema))
    query: OrderQueryDto,
  ) {
    return this.orderService.findAllOrder(query);
  }

  @Get('my')
  async findMyOrders(
    @CurrentUser() user: { id: number },
    @Query(new ZodValidationPipe(OrderQuerySchema))
    query: OrderQueryDto,
  ) {
    return this.orderService.findMyOrders(user.id, query);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: { id: number }, @Param('id') id: string) {
    return this.orderService.findOrderByIdAndUserId(user.id, +id);
  }

  @Patch(':id/cancel')
  async cancel(@CurrentUser() user: { id: number }, @Param('id') id: string) {
    return this.orderService.cancelOrder(user.id, +id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions('order:update_status')
  async updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusSchema))
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(+id, updateOrderStatusDto);
  }
}

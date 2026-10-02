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

  // Create order — USER only
  @Post()
  @UseGuards(RolesGuard)
  @Roles('USER')
  async create(
    @CurrentUser() user: { id: number },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.create(createOrderDto, user.id);
  }

  // Admin: get all orders
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

  // Authenticated user: get own orders
  @Get('my')
  async findMyOrders(
    @CurrentUser() user: { id: number },
    @Query(new ZodValidationPipe(OrderQuerySchema))
    query: OrderQueryDto,
  ) {
    return this.orderService.findMyOrders(user.id, query);
  }

  // Order detail: USER own only; ADMIN any order (with payment fields)
  @Get(':id')
  async findOne(
    @CurrentUser() user: { id: number; role: string },
    @Param('id') id: string,
  ) {
    return this.orderService.findOrderByIdForDetail(user, +id);
  }

  // User: cancel own order
  @Patch(':id/cancel')
  async cancel(@CurrentUser() user: { id: number }, @Param('id') id: string) {
    return this.orderService.cancelOrder(user.id, +id);
  }

  // Admin: update order status
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

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AdminDashboardService } from './admin-dashboard.service.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Permissions } from '../common/decorators/permissions.decorator.js';
import { successResponse } from '../common/helpers/response.helper.js';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  /**
   * ADMIN-only dashboard aggregates.
   * Frontend must not compute authoritative revenue/order stats.
   */
  @Get('dashboard')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions('order:read')
  @ApiOperation({
    summary: 'Admin dashboard metrics (ADMIN only)',
  })
  async getDashboard() {
    const data = await this.adminDashboardService.getDashboard();
    return successResponse(data, 'Dashboard admin berhasil diambil');
  }
}

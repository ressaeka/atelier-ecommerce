import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminSalesReportService } from './admin-sales-report.service.js';
import { AdminBestSellingService } from './admin-best-selling.service.js';
import { AdminCustomerReportService } from './admin-customer-report.service.js';
import {
  SalesReportQueryDto,
  SalesReportQuerySchema,
} from './dto/sales-report-query.dto.js';
import {
  BestSellingQueryDto,
  BestSellingQuerySchema,
} from './dto/best-selling-query.dto.js';
import {
  CustomerReportQueryDto,
  CustomerReportQuerySchema,
} from './dto/customer-report-query.dto.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Permissions } from '../common/decorators/permissions.decorator.js';
import { successResponse } from '../common/helpers/response.helper.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@Controller('admin')
export class AdminDashboardController {
  constructor(
    private readonly adminDashboardService: AdminDashboardService,
    private readonly adminSalesReportService: AdminSalesReportService,
    private readonly adminBestSellingService: AdminBestSellingService,
    private readonly adminCustomerReportService: AdminCustomerReportService,
  ) {}

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

  /**
   * ADMIN-only sales report with date range filters, KPIs, daily trend, and transaction rows.
   */
  @Get('reports/sales')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions('order:read')
  @ApiOperation({
    summary: 'Laporan penjualan admin (ADMIN only)',
  })
  async getSalesReport(
    @Query(new ZodValidationPipe(SalesReportQuerySchema))
    query: SalesReportQueryDto,
  ) {
    const data = await this.adminSalesReportService.getSalesReport(query);
    return successResponse(data, 'Laporan penjualan berhasil diambil');
  }

  /**
   * ADMIN-only export sales report to Excel (.xlsx) with all matching records.
   */
  @Get('reports/sales/export')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions('order:read')
  @ApiOperation({
    summary: 'Export laporan penjualan ke Excel .xlsx (ADMIN only)',
  })
  async exportSalesReport(
    @Query(new ZodValidationPipe(SalesReportQuerySchema))
    query: SalesReportQueryDto,
    @Res() res: Response,
  ) {
    const { buffer, filename } =
      await this.adminSalesReportService.exportSalesReportExcel(query);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.end(buffer);
  }

  /**
   * ADMIN-only best-selling products report with rankings, date filters, unit sold, and revenue.
   */
  @Get('reports/best-selling-products')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions('order:read')
  @ApiOperation({
    summary: 'Laporan produk terlaris admin (ADMIN only)',
  })
  async getBestSellingProducts(
    @Query(new ZodValidationPipe(BestSellingQuerySchema))
    query: BestSellingQueryDto,
  ) {
    const data =
      await this.adminBestSellingService.getBestSellingProducts(query);
    return successResponse(data, 'Laporan produk terlaris berhasil diambil');
  }

  /**
   * ADMIN-only customer report with date range filters, KPIs, spending aggregates, and customer rows.
   */
  @Get('reports/customers')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions('user:read')
  @ApiOperation({
    summary: 'Laporan pelanggan admin (ADMIN only)',
  })
  async getCustomerReport(
    @Query(new ZodValidationPipe(CustomerReportQuerySchema))
    query: CustomerReportQueryDto,
  ) {
    const data =
      await this.adminCustomerReportService.getCustomerReport(query);
    return successResponse(data, 'Laporan pelanggan berhasil diambil');
  }
}


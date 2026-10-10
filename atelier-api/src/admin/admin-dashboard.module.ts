import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminSalesReportService } from './admin-sales-report.service.js';
import { AdminBestSellingService } from './admin-best-selling.service.js';
import { AdminCustomerReportService } from './admin-customer-report.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AdminDashboardController],
  providers: [
    AdminDashboardService,
    AdminSalesReportService,
    AdminBestSellingService,
    AdminCustomerReportService,
  ],
  exports: [
    AdminDashboardService,
    AdminSalesReportService,
    AdminBestSellingService,
    AdminCustomerReportService,
  ],
})
export class AdminDashboardModule {}

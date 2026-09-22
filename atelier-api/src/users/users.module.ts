import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, RolesGuard],
  exports: [UsersService, UsersRepository],
  imports: [PrismaModule],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { AddressService } from './address.service.js';
import { AddressController } from './address.controller.js';
import { AddressRepository } from './address.repository.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersRepository } from '../users/users.repository.js';
@Module({
  controllers: [AddressController],
  providers: [AddressService, AddressRepository, UsersRepository],
  exports: [AddressRepository],
  imports: [PrismaModule],
})
export class AddressModule {}

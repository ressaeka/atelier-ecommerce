import { Module } from '@nestjs/common';
import { AddressService } from './address.service.js';
import { AddressController } from './address.controller.js';
import { AddressRepository } from './address.repository.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  controllers: [AddressController],
  providers: [AddressService, AddressRepository],
  exports: [AddressRepository],
  imports: [PrismaModule],
})
export class AddressModule {}

import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Body,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UsersService } from './users.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { successResponse } from '../common/helpers/response.helper.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Permissions } from '../common/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { PERMISSIONS } from '../common/permissions/permission.js';
import { updateUserSchema, UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { queryUsersSchema, QueryUsersDto } from './dto/query-users.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import {
  queryUsersLimit,
  queryUsersPage,
  queryUsersSearch,
  updateUserApiBody,
  userDeleteResponseSchema,
  userResponseSchema,
  usersListResponseSchema,
} from './users.swagger.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.PROFILE_READ)
  @ApiOperation({ summary: 'Ambil profil pengguna yang sedang login' })
  @ApiResponse(userResponseSchema)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMe(@CurrentUser() user: JwtPayload) {
    const identity = await this.usersService.findById(user.sub);

    return successResponse(identity, 'Profil berhasil diambil');
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.PROFILE_UPDATE)
  @ApiOperation({ summary: 'Perbarui profil pengguna yang sedang login' })
  @ApiBody(updateUserApiBody)
  @ApiResponse(userResponseSchema)
  @ApiResponse({ status: 400, description: 'Validasi input gagal' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateUserSchema))
    updateUserDto: UpdateUserDto,
  ) {
    const identity = await this.usersService.update(user.sub, updateUserDto);

    return successResponse(identity, 'Profil berhasil diperbarui');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.USER_READ)
  @ApiOperation({ summary: 'Ambil data user berdasarkan ID (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID User' })
  @ApiResponse(userResponseSchema)
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Role ADMIN & permission USER_READ)',
  })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);

    return successResponse(user, 'User berhasil diambil');
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.USER_READ)
  @ApiOperation({
    summary:
      'Ambil daftar semua user dengan paginasi dan pencarian (Admin only)',
  })
  @ApiQuery(queryUsersPage)
  @ApiQuery(queryUsersLimit)
  @ApiQuery(queryUsersSearch)
  @ApiResponse(usersListResponseSchema)
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Role ADMIN & permission USER_READ)',
  })
  async findAll(
    @Query(new ZodValidationPipe(queryUsersSchema))
    query: QueryUsersDto,
  ) {
    const users = await this.usersService.findAll(query);

    return successResponse(users, 'Users berhasil diambil');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.USER_UPDATE)
  @ApiOperation({ summary: 'Perbarui user berdasarkan ID (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID User' })
  @ApiBody(updateUserApiBody)
  @ApiResponse(userResponseSchema)
  @ApiResponse({ status: 400, description: 'Validasi input gagal' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Role ADMIN & permission USER_UPDATE)',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateUserSchema))
    updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);

    return successResponse(user, 'User berhasil diupdate');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN')
  @Permissions(PERMISSIONS.USER_DELETE)
  @ApiOperation({ summary: 'Hapus user berdasarkan ID (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID User' })
  @ApiResponse(userDeleteResponseSchema)
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Role ADMIN & permission USER_DELETE)',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.usersService.remove(id);

    return successResponse(result, 'User berhasil dihapus');
  }
}

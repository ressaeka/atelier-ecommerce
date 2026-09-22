import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { ROLE_PERMISSIONS } from '../permissions/role-permissions.js';
import { Permission } from '../permissions/permission.js';
import { Role } from '../../../generated/prisma/enums.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { role: Role };
    }>();

    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User tidak memiliki akses');
    }

    const userRole = user.role;

    const userPermissions = ROLE_PERMISSIONS[userRole] ?? [];

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Anda tidak memiliki permission');
    }

    return true;
  }
}

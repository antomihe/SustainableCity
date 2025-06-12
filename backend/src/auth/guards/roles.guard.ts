// backend\src\auth\guards\roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { Role } from '../../users/enums/role.enum';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles specified, access granted
    }
    const { user } = context.switchToHttp().getRequest<{ user: User }>();
    
    // If user is not present (e.g. JwtAuthGuard hasn't run or failed)
    if (!user || !user.role) {
        return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
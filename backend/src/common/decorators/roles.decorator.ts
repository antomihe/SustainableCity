// backend\src\common\decorators\roles.decorator.ts
import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { Role } from '../../users/enums/role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

export const ROLES_KEY = 'roles';
export const Protected = (...roles: Role[]) => {
  const decoratorsToApply = [
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard), 
    ApiBearerAuth(), 
  ];
  return applyDecorators(...decoratorsToApply);
};
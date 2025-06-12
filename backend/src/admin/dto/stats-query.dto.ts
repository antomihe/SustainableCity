// backend\src\admin\dto\stats-query.dto.ts
// backend/src/admin/dto/stats-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsISO8601, IsEnum, IsString } from 'class-validator';
import { ContainerType } from '../../containers/enums/container-type.enum';

export class StatsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de contenedor específico (omitir o "ALL" para todos)',
    enum: ContainerType,
    example: ContainerType.ELECTRONICS,
  })
  @IsOptional()
  @IsEnum(ContainerType, { message: 'containerType debe ser un valor válido del enum ContainerType' })
  @IsString() 
  containerType?: ContainerType;
}
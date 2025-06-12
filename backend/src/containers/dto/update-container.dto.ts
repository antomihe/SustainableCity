// backend\src\containers\dto\update-container.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateContainerDto } from './create-container.dto';
import { IsOptional, IsDateString, IsEnum, IsInt, Max, Min } from 'class-validator';
import { ContainerStatus } from '../enums/container-status.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContainerDto extends PartialType(CreateContainerDto) {
    @ApiPropertyOptional({ description: 'Timestamp of the last time the container was emptied' })
    @IsOptional()
    @IsDateString()
    lastEmptiedAt?: string;
}

export class UpdateContainerStatusDto {
  @ApiPropertyOptional({ example: 50, description: 'New fill level percentage (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  fillLevel?: number;

  @ApiPropertyOptional({ enum: ContainerStatus, example: ContainerStatus.OK, description: 'New status of the container' })
  @IsOptional()
  @IsEnum(ContainerStatus)
  status?: ContainerStatus;
}
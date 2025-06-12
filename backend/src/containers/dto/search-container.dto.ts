// backend\src\containers\dto\search-container.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { ContainerStatus } from '../enums/container-status.enum';
import { ContainerType } from '../enums/container-type.enum';

export class SearchContainerQueryDto {
  @ApiPropertyOptional({ description: 'Latitude for geospatial search center point.', example: 40.7128 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude({ message: 'validation.IS_LATITUDE' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for geospatial search center point.', example: -74.0060 })
  @ValidateIf(o => o.latitude !== undefined || o.radius !== undefined)
  @IsNotEmpty({ message: 'validation.LONGITUDE_REQUIRED' }) 
  @Type(() => Number)
  @IsLongitude({ message: 'validation.IS_LONGITUDE' })
  longitude?: number;

  @ApiPropertyOptional({ description: 'Search radius in kilometers from the center point.', example: 5 })
  @ValidateIf(o => o.latitude !== undefined || o.longitude !== undefined)
  @IsNotEmpty({ message: 'validation.RADIUS_REQUIRED' }) 
  @Type(() => Number)
  @IsNumber({}, { message: 'validation.IS_NUMBER' })
  @Min(0.1, { message: 'validation.RADIUS_MIN' }) 
  radius?: number;

  @ApiPropertyOptional({
    description: 'Array of container statuses to filter by.',
    type: [String], 
    enum: ContainerStatus,
    isArray: true,
    example: [ContainerStatus.FULL, ContainerStatus.DAMAGED],
  })
  @IsOptional()
  @IsArray({ message: 'validation.IS_ARRAY' })
  @IsEnum(ContainerStatus, {
    each: true,
    message: 'validation.IS_ENUM'
  })
  statuses?: ContainerStatus[];

  @ApiPropertyOptional({
    description: 'Array of container types to filter by.',
    type: [String], 
    enum: ContainerType,
    isArray: true,
    example: [ContainerType.GENERAL, ContainerType.ORGANIC],
  })
  @IsOptional()
  @IsArray({ message: 'validation.IS_ARRAY' })
  @IsEnum(ContainerType, {
    each: true,
    message: 'validation.IS_ENUM'
  })
  types?: ContainerType[];

  @ApiPropertyOptional({ description: 'A general search term for location or other text fields.', example: 'Biblioteca' })
  @IsOptional()
  @IsString({ message: 'validation.IS_STRING' })
  searchTerm?: string;
}
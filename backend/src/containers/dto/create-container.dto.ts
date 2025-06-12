// backend\src\containers\dto\create-container.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContainerStatus } from '../enums/container-status.enum';
import { ContainerType } from '../enums/container-type.enum';

class CoordinatesDto {
  @ApiProperty({ example: 40.7128 })
  @IsNumber({}, { message: 'validation.IS_NUMBER' })
  lat: number;

  @ApiProperty({ example: -74.0060 })
  @IsNumber({}, { message: 'validation.IS_NUMBER' })
  lng: number;
}

export class CreateContainerDto {
  @ApiProperty({ example: 'Edificio Principal - Cafetería' })
  @IsString({ message: 'validation.IS_STRING' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  location: string;

  @ApiProperty({ type: CoordinatesDto })
  @IsObject({ message: 'validation.IS_OBJECT' })
  @ValidateNested() // class-validator should handle nested messages well with I18nValidationPipe
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;

  @ApiProperty({ example: 100, default: 100 })
  @IsInt({ message: 'validation.IS_INT' })
  @Min(1, { message: 'validation.MIN' })
  capacity: number;

  @ApiPropertyOptional({ enum: ContainerType, example: ContainerType.GENERAL, default: ContainerType.GENERAL })
  @IsOptional()
  @IsEnum(ContainerType, { message: 'validation.IS_ENUM' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  type?: ContainerType = ContainerType.GENERAL;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt({ message: 'validation.IS_INT' })
  @Min(0, { message: 'validation.MIN' })
  @Max(100, { message: 'validation.MAX' })
  fillLevel?: number = 0;

  @ApiPropertyOptional({ enum: ContainerStatus, example: ContainerStatus.OK, default: ContainerStatus.OK })
  @IsOptional()
  @IsEnum(ContainerStatus, { message: 'validation.IS_ENUM' })
  status?: ContainerStatus = ContainerStatus.OK;
}
// backend\src\incidents\dto\report-incident.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';
import { IncidentType } from '../enums/incident-type.enum';
import { Transform } from 'class-transformer';
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export class ReportIncidentDto {
  @ApiProperty({ description: 'ID of the container involved in the incident', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID('4', { message: 'validation.IS_UUID' }) 
  containerId: string;

  @ApiPropertyOptional({ description: 'Detailed description of the incident (required if type is not FULL)', example: 'Lid is broken' })
  @ValidateIf(o => o.type !== IncidentType.FULL) 
  @IsNotEmpty({ message: 'incident.DESCRIPTION_REQUIRED_FOR_NON_FULL' }) 
  @IsString({ message: 'validation.IS_STRING' })
  description?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const upperValue = value.toUpperCase();
      if (IncidentType[upperValue as keyof typeof IncidentType]) {
        return IncidentType[upperValue as keyof typeof IncidentType];
      }
    }
    return value; 
  })
  @ApiProperty({
    description: 'Type of the incident',
    enum: IncidentType, 
    example: IncidentType.DAMAGED
  })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  @IsEnum(IncidentType, { message: 'validation.IS_ENUM' }) 
  type: IncidentType;
}

// backend\src\assignments\dto\assign-containers.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignContainersDto {
    @ApiProperty({
        type: [String],
        description: 'Array of container IDs to assign to the operator',
        example: ['uuid-container-1', 'uuid-container-2']
    })
    @IsArray({ message: 'validation.IS_ARRAY' }) 
    @IsUUID('all', { each: true, message: 'validation.IS_UUID_EACH' }) 
    containerIds: string[];
}
// backend\src\assignments\dto\assign-operators.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignOperatorDto { 
    @ApiProperty({
        type: [String],
        description: 'Array of operator User IDs to assign to the container', 
        example: ['uuid-operator-1', 'uuid-operator-2']
    })
    @IsArray({ message: 'validation.IS_ARRAY' })
    @IsUUID('all', { each: true, message: 'validation.IS_UUID_EACH' }) 
    operatorIds: string[]; 
}
// backend\src\containers\dto\container-with-distance-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Container } from "../entities/container.entity";

export class ContainerWithDistanceResponseDto extends Container {
    @ApiProperty({
        description: 'Distance from the user\'s location to the container',
        example: 15
    })
    distance: number;

}
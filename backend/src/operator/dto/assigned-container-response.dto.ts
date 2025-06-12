// backend\src\operator\dto\assigned-container-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { ContainerStatus } from "../../containers/enums/container-status.enum";
import { ContainerType } from "../../containers/enums/container-type.enum";

export class AssignedContainerResponseDto {
    @ApiProperty( { description: "ID of the container" })
    id: string;
    @ApiProperty( { description: "Location of the container" })
    location: string;
    @ApiProperty( { description: "Fill level of the container" })
    fillLevel: number;
    @ApiProperty( { description: "Status of the container" , enum: ContainerStatus })
    status: ContainerStatus;
    @ApiProperty( { description: "Description of the incident" })
    description: string;
    @ApiProperty( { description: "Type of the container", enum: ContainerType })
    containerType: ContainerType;
    @ApiProperty( { description: "Last update of the container" })
    lastUpdated: Date;
}
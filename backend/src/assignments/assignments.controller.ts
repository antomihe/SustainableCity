// backend\src\assignments\assignments.controller.ts
import { Controller, Get, Put, Body, Param, ParseUUIDPipe, Req } from '@nestjs/common'; 
import { AssignmentsService } from './assignments.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Protected } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { OperatorAssignment } from './entities/operator-assignment.entity';
import { AssignContainersDto } from './dto/assign-containers.dto';
import { Container } from '../containers/entities/container.entity';
import { User } from '../users/entities/user.entity';
import { Request } from 'express'; 
import { ApiCommonResponses } from '../common/decorators/api-common-responses.decorator';
import { AssignOperatorDto } from './dto/assign-operators.dto';

@ApiTags('Assignments')
@Controller({ path: 'assignments', version: '1' })
@ApiBearerAuth()
@ApiCommonResponses()

export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Protected(Role.Admin)
  @Put('operator/:operatorId')
  @ApiOperation({ summary: 'Assign/Update containers for a specific operator (Admin only)' })
  @ApiParam({ name: 'operatorId', type: 'string', description: 'User ID of the operator' })
  @ApiResponse({ status: 200, description: 'Container assignments updated successfully.', type: [OperatorAssignment] })
  @ApiResponse({ status: 404, description: 'Operator or one of the containers not found.' }) 
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., operatorId is not an operator, validation error).' }) 
  async assignContainersToOperator(
    @Param('operatorId', ParseUUIDPipe) operatorId: string,
    @Body() assignDto: AssignContainersDto,
  ): Promise<OperatorAssignment[]> {
    return this.assignmentsService.assignContainersToOperator(operatorId, assignDto.containerIds);
  }

  @Protected(Role.Admin)
  @Put('container/:containerId')
  @ApiOperation({ summary: 'Assign/Update operators for a specific container (Admin only)' })
  @ApiParam({ name: 'containerId', type: 'string', description: 'ID of the container' })
  @ApiResponse({ status: 200, description: 'Operators assigned to the container successfully.', type: [OperatorAssignment] })
  @ApiResponse({ status: 404, description: 'Container or one of the operators not found.' }) 
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., validation error).' }) 
  async assignOperatorsToContainer(
    @Param('containerId', ParseUUIDPipe) containerId: string,
    @Body() assignDto: AssignOperatorDto,
  ): Promise<OperatorAssignment[]> {
    return this.assignmentsService.assignOperatorsToContainer(containerId, assignDto.operatorIds);
  }

  @Protected(Role.Admin)
  @Get('operator/:operatorId')
  @ApiOperation({ summary: "Get all containers assigned to a specific operator (Admin view)" })
  @ApiParam({ name: 'operatorId', type: 'string', description: 'User ID of the operator' })
  @ApiResponse({ status: 200, description: "List of operator's assigned containers.", type: [Container] })
  @ApiResponse({ status: 404, description: 'Operator not found.' }) 
  @ApiResponse({ status: 400, description: 'Operator is not of role Operator.'}) 
  async getAssignedContainersForOperatorByAdmin(
    @Param('operatorId', ParseUUIDPipe) operatorId: string,
  ): Promise<Container[]> {
    return this.assignmentsService.getAssignedContainersForOperator(operatorId);
  }

  @Protected(Role.Admin)
  @Get('container/:containerId')
  @ApiOperation({ summary: "Get all operators assigned to a specific container (Admin view)" })
  @ApiParam({ name: 'containerId', type: 'string', description: 'ID of the container' })
  @ApiResponse({ status: 200, description: "List of operators assigned to the container.", type: [User] })
  @ApiResponse({ status: 404, description: 'Container not found.'}) 
  async getOperatorsForContainerByAdmin(
    @Param('containerId', ParseUUIDPipe) containerId: string,
  ): Promise<User[]> {
    return this.assignmentsService.getOperatorsForContainer(containerId);
  }

  @Protected(Role.Operator)
  @Get('my-tasks')
  @ApiOperation({ summary: "Get the current operator's assigned containers/tasks" })
  @ApiResponse({ status: 200, description: "List of logged-in operator's assigned containers.", type: [Container] })
  @ApiResponse({ status: 404, description: 'Operator not found (e.g., if user token is invalid or user deleted).' }) 
  @ApiResponse({ status: 400, description: 'Logged-in user is not an operator.'}) 
  async getMyAssignedContainers(
    @Req() req: Request & { user: User }, 
  ): Promise<Container[]> {
    const operatorId = req.user.id;
    return this.assignmentsService.getAssignedContainersForOperator(operatorId);
  }
}
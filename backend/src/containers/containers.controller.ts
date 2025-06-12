// backend\src\containers\containers.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { ContainersService } from './containers.service';
import { CreateContainerDto } from './dto/create-container.dto';
import { UpdateContainerDto, UpdateContainerStatusDto } from './dto/update-container.dto';
import { Container } from './entities/container.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Protected } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { ApiCommonResponses } from '../common/decorators/api-common-responses.decorator';
import { SearchContainerQueryDto } from './dto/search-container.dto';
import { ContainerWithDistanceResponseDto } from './dto/container-with-distance-response.dto';

@ApiTags('Containers')
@Controller({ path: 'containers', version: '1' })
@ApiCommonResponses()
export class ContainersController {
  constructor(private readonly containersService: ContainersService) { }

  @Post()
  @Protected(Role.Admin)
  @ApiOperation({ summary: 'Create a new container (Admin only)' })
  @ApiResponse({ status: 201, description: 'Container created successfully.', type: Container })
  create(@Body() createContainerDto: CreateContainerDto): Promise<Container> {
    return this.containersService.create(createContainerDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all containers (Public)' })
  @ApiResponse({ status: 200, description: 'List of all containers.', type: [Container] })
  findAll(): Promise<Container[]> {
    return this.containersService.findAll();
  }

  @Public()
  @Post('search')
  @ApiOperation({ summary: 'Search for containers based on multiple criteria including geospatial data' })
  @ApiResponse({ status: 200, description: 'List of containers matching criteria.', type: [ContainerWithDistanceResponseDto] })
  async searchContainers(@Body() searchDto: SearchContainerQueryDto): Promise<ContainerWithDistanceResponseDto[]> {
    return this.containersService.searchContainers(searchDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a container by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Container found.', type: Container })
  @ApiResponse({ status: 404, description: 'Container not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Container> {
    return this.containersService.findOne(id);
  }

  @Patch(':id')
  @Protected(Role.Admin)
  @ApiOperation({ summary: 'Update a container (Admin only)' })
  @ApiBody({ type: UpdateContainerDto })
  @ApiResponse({ status: 200, description: 'Container updated successfully.', type: Container })
  @ApiResponse({ status: 404, description: 'Container not found.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateContainerDto: UpdateContainerDto): Promise<Container> {
    return this.containersService.update(id, updateContainerDto);
  }

  @Patch(':id/status')
  @Protected(Role.Admin, Role.Operator)
  @ApiOperation({ summary: 'Update container status/fill level (Admin/Operator)' })
  @ApiBody({ type: UpdateContainerStatusDto })
  @ApiResponse({ status: 200, description: 'Container status updated successfully.', type: Container })
  @ApiResponse({ status: 404, description: 'Container not found.' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateContainerStatusDto,
  ): Promise<Container> {
    return this.containersService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @Protected(Role.Admin)
  @ApiOperation({ summary: 'Delete a container (Admin only)' })
  @ApiResponse({ status: 204, description: 'Container deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Container not found.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.containersService.remove(id);
  }

}
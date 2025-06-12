// backend\src\users\users.controller.ts

import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from './enums/role.enum';
import { Protected } from '../common/decorators/roles.decorator';
import { ApiCommonResponses } from '../common/decorators/api-common-responses.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service'; 

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
@ApiCommonResponses()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) { }

  @Get('operator')
  @Protected(Role.Admin)
  @ApiOperation({ summary: 'Get all operator role users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users.', type: [User] })
  async findAllOperators(): Promise<User[]> {
    return await this.usersService.findAllByRole(Role.Operator);
  }

  @Get(':id')
  @Protected(Role.Admin)
  @ApiOperation({ summary: 'Get a user by ID (Admin or self)' })
  @ApiResponse({ status: 200, description: 'User found.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' }) 
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User | null> {
    return await this.usersService.findOne(id);
  }

  @Delete(':id')
  @Protected(Role.Admin)
  @ApiOperation({ summary: 'Delete a user by ID (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' }) 
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.usersService.remove(id);
  }

  @Patch(':id')
  @Protected(Role.Admin)
  @ApiOperation({ summary: 'Update a user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' }) 
  @ApiResponse({ status: 409, description: 'Conflict, e.g., email already in use.' }) 
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.usersService.update(id, updateUserDto);
  }

  @Post('operator')
  @Protected(Role.Admin)
  @ApiOperation({ summary: 'Create a new operator user (Admin only)' })
  @ApiResponse({ status: 201, description: 'Operator created successfully.', type: User })
  @ApiResponse({ status: 409, description: 'Conflict, e.g., email already in use.' }) 
  async createOperator(
    @Body() createUserDto: CreateUserDto,
  ): Promise<User> {
    const createdUser = await this.usersService.create(createUserDto, Role.Operator);
    
    await this.authService.sendPasswordActionEmail(createdUser, 'SET_INITIAL_PASSWORD');
    return createdUser;
  }
}
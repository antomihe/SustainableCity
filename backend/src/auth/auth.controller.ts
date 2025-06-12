// backend\src\auth\auth.controller.ts

import { Controller, Post, Body, UseGuards, Req, Get, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Role } from '../users/enums/role.enum';
import { RecoverPasswordDto, SetPasswordDto } from './dto/password.dto';
import { ApiCommonResponses } from '../common/decorators/api-common-responses.decorator';
import { AuthResponseDto } from './dto/auth-response.dto'; 
import { RequestPasswordResponseDto } from './dto/request-password-response.dto';
import { I18nService, I18nContext } from 'nestjs-i18n'; 

type UserPublicProfile = Omit<User, 'password' | 'passwordResetExpires'>;

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
@ApiCommonResponses()
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private readonly i18n: I18nService, 
  ) {}

  private async getLangFromRequest(req?: ExpressRequest): Promise<string> {
    return I18nContext.current()?.lang;
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK) 
  @ApiOperation({ summary: 'Log in a user with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized. Invalid credentials or account requires setup/is inactive.' }) 
  async login(@Req() req: ExpressRequest & { user: User }): Promise<AuthResponseDto> { 
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new student user (account will be inactive, requires password setup via email)' })
  @ApiResponse({ status: 201, description: 'User created. An email has been sent to set password and activate account.', type: User })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., validation failed).' }) 
  @ApiResponse({ status: 409, description: 'Conflict. Email already exists.' })
  async register(@Body() createUserDto: CreateUserDto): Promise<UserPublicProfile> {
    const newUser = await this.usersService.create(createUserDto, Role.Student);
    await this.authService.sendPasswordActionEmail(newUser, 'SET_INITIAL_PASSWORD');

    const { password, passwordResetExpires, ...result } = newUser;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved.', type: User }) 
  @ApiResponse({ status: 401, description: 'Unauthorized.' }) 
  getProfile(@Req() req: ExpressRequest & { user: User }): UserPublicProfile {
    const { password, passwordResetExpires, ...result } = req.user;
    return result;
  }

  @Public()
  @Post('request-password-action')
  @ApiOperation({ summary: 'Request an email to set initial password or reset forgotten password' })
  @ApiBody({ type: RecoverPasswordDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'If the email is registered and eligible, an email will be sent with instructions.', type: RequestPasswordResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request (e.g., invalid email format).' }) 
  @HttpCode(HttpStatus.OK)
  async requestPasswordAction(
    @Body() recoverPasswordDto: RecoverPasswordDto,
    @Req() req: ExpressRequest, 
  ): Promise<RequestPasswordResponseDto> {
    await this.authService.handleRequestPasswordAction(recoverPasswordDto.email);
    const lang = await this.getLangFromRequest(req);
    const message = await this.i18n.t('auth.REQUEST_PASSWORD_ACTION_SUCCESS_MESSAGE', { lang });
    return { message };
  }

  @Public()
  @Post('set-new-password')
  @ApiOperation({ summary: 'Set or reset a user password using a token from email' })
  @ApiBody({ type: SetPasswordDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password has been successfully set/reset.', type: User }) 
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request (e.g., invalid token, token expired, password too short).' }) 
  @HttpCode(HttpStatus.OK)
  async setNewPasswordWithToken(@Body() setPasswordDto: SetPasswordDto): Promise<UserPublicProfile> {
    const updatedUser = await this.authService.setNewPasswordWithToken(setPasswordDto.token, setPasswordDto.newPassword);
    return updatedUser;
  }
}
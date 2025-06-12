// backend\src\auth\dto\password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'; 

export class RecoverPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email of the user requesting password recovery' })
  @IsEmail({}, { message: 'validation.IS_EMAIL' }) 
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' }) 
  email: string;
}

export class SetPasswordDto {
  @ApiProperty({ description: 'The password reset token received by email' })
  @IsString({ message: 'validation.IS_STRING' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' }) 
  token: string;

  @ApiProperty({ example: 'NewP@$$wOrd123', description: 'The new password for the user (min 6 characters)' })
  @IsString({ message: 'validation.IS_STRING' })
  @MinLength(6, { message: 'auth.PASSWORD_MIN_LENGTH' }) 
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' }) 
  newPassword: string;
}
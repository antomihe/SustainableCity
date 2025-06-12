// backend\src\auth\dto\login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'validation.IS_EMAIL' }) 
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString({ message: 'validation.IS_STRING' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  @MinLength(6, { message: 'validation.MIN_LENGTH' }) 
  password: string;
}
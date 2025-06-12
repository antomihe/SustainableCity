// backend\src\users\dto\create-user.dto.ts
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'validation.IS_EMAIL' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  email: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @IsString({ message: 'validation.IS_STRING' })
  @MinLength(2, { message: 'validation.MIN_LENGTH' })
  name: string; 
}
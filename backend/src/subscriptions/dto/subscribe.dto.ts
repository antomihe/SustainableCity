// backend\src\subscriptions\dto\subscribe.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ example: 'student@example.com', description: 'Email address for subscription' })
  @IsEmail({}, { message: 'validation.IS_EMAIL' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  email: string;

  @ApiPropertyOptional({ example: 'en', description: 'Preferred language for communication (e.g., "en", "es"). If not provided, it may be inferred from request headers or default to a system setting.' })
  @IsOptional()
  @IsString({ message: 'validation.IS_STRING' })
  @Length(2, 10, { message: 'validation.LENGTH' })
  language?: string;
}
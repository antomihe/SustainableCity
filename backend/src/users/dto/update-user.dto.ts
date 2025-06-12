// backend\src\users\dto\update-user.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
    @ApiPropertyOptional({ description: 'Email address of the user', example: 'updated.user@example.com' })
    @IsOptional()
    @IsEmail({}, { message: 'validation.IS_EMAIL' })
    email?: string;

    @ApiPropertyOptional({ description: 'Name of the user', example: 'Jane Doe' })
    @IsOptional()
    @IsString({ message: 'validation.IS_STRING' })
    @MinLength(2, { message: 'validation.MIN_LENGTH' })
    name?: string;
}
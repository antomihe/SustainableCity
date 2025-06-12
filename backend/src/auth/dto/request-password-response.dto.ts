import { ApiProperty } from "@nestjs/swagger";

export class RequestPasswordResponseDto {
    @ApiProperty({
        example: 'Password reset email sent successfully.',
        description: 'Message indicating the result of the password reset request.',
    })
    message: string;
}
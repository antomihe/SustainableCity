// backend\src\common\decorators\api-common-responses.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';

export function ApiCommonResponses() {
  return applyDecorators(
    ApiUnauthorizedResponse({ description: 'Unauthorized. No token or invalid token provided.' }),
    ApiForbiddenResponse({ description: 'Forbidden. User does not have the required role.' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error.' }),
  );
}
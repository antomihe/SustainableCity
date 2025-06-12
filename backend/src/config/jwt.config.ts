// backend\src\config\jwt.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'defaultSecret',
  expirationTime: process.env.JWT_EXPIRATION_TIME || '3600s',
}));
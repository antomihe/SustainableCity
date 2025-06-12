// backend\src\config\email.config.ts
import { registerAs } from '@nestjs/config';

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure?: boolean;
}

export default registerAs(
  'email',
  (): EmailConfig => ({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || '"No Reply" <noreply@example.com>',
    secure: process.env.EMAIL_SECURE === 'true', // Ejemplo: true para puerto 465
  }),
);
// backend\src\config\app.config.ts
import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  apiPrefix: string;
  nodeEnv: string;
  adminEmail: string; 
  frontendUrl: string;
  defaultLanguage: string; 
  appMode: 'default' | 'demo'; 
}

export default registerAs(
  'app',
  (): AppConfig => {
    return {
      port: parseInt(process.env.APP_PORT, 10) || 3001,
      apiPrefix: process.env.API_PREFIX || 'api',
      nodeEnv: process.env.NODE_ENV || 'development',
      adminEmail: process.env.ADMIN_EMAIL, 
      frontendUrl: process.env.FRONTEND_URL,
      defaultLanguage: process.env.DEFAULT_LANGUAGE,
      appMode: (process.env.APP_MODE === 'demo' ? 'demo' : 'default'), 
    };
  },
);
// backend\src\common\adapters\socket-io.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Server as SocketIoServer } from 'socket.io';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/app.config'; 

export class SocketIoCorsAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIoCorsAdapter.name);

  constructor(
    private readonly app: INestApplicationContext,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): SocketIoServer {
    const configService = this.app.get(ConfigService); 
    const appConfig = configService.get<AppConfig>('app'); 

    const frontendUrl = appConfig.frontendUrl;
    this.logger.log(`Configuring WebSocket CORS for origins: ${frontendUrl}`);

    const corsOptions = {
      origin: frontendUrl,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 
      credentials: true,
    };

    const serverOptionsWithCors: ServerOptions = {
      ...options,
      cors: corsOptions,
    };

    return super.createIOServer(port, serverOptionsWithCors);
  }
}
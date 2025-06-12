// backend\src\containers\containers.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { ContainersService } from './containers.service';
import { Container } from './entities/container.entity';

@WebSocketGateway({
  namespace: 'containers',
})
export class ContainersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ContainersGateway');

  constructor(
    @Inject(forwardRef(() => ContainersService))
    private readonly containersService: ContainersService
  ) { }

  afterInit(_server: Server) {
    this.logger.log('ContainersGateway Initialized (CORS handled by SocketIoCorsAdapter)');
  }

  async handleConnection(client: Socket, ..._args: any[]) {

    const containers = await this.containersService.findAll();
    client.emit('containersUpdate', containers);
  }

  handleDisconnect(client: Socket) {
    
  }

  @SubscribeMessage('requestAllContainers')
  async handleRequestAllContainers(client: Socket): Promise<void> {
    const containers = await this.containersService.findAll();
    client.emit('containersUpdate', containers);
  }

  broadcastContainerUpdate(container: Container): void {
    this.server.emit('containerUpdated', container);
    this.logger.log(`Broadcasted containerUpdated for ${container.id}`);
  }

  broadcastContainerDeletion(containerId: string): void {
    this.server.emit('containerDeleted', { id: containerId });
    this.logger.log(`Broadcasted containerDeleted for ${containerId}`);
  }

  broadcastCriticalContainerAlert(container: Container): void {
    this.server.emit('criticalContainerAlert', container);
    this.logger.log(`Broadcasted criticalContainerAlert for ${container.id}`);
  }
}
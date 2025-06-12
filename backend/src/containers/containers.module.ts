// backend\src\containers\containers.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContainersService } from './containers.service';
import { ContainersGateway } from './containers.gateway';
import { ContainersController } from './containers.controller';
import { Container } from './entities/container.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Container]),
  ],
  controllers: [ContainersController],
  providers: [
    ContainersService,
    ContainersGateway,
  ],
  exports: [
    ContainersService,
    ContainersGateway,
  ],
})
export class ContainersModule {}

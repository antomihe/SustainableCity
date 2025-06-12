// backend\src\incidents\incidents.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ContainersModule } from '../containers/containers.module'; 
import { AuthModule } from '../auth/auth.module'; 
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [
    forwardRef(() => ContainersModule), 
    AuthModule, 
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService], 
})
export class IncidentsModule {}
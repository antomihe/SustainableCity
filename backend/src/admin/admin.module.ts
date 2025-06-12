// backend\src\admin\admin.module.ts
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ContainersModule } from '../containers/containers.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { StatisticsModule } from '../statistics/statistics.module';

@Module({
  imports: [ContainersModule, IncidentsModule, StatisticsModule, ContainersModule], 
  controllers: [AdminController],
})
export class AdminModule {}
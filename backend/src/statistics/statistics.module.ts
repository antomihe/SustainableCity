// backend\src\statistics\statistics.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { Container } from '../containers/entities/container.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Container])],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
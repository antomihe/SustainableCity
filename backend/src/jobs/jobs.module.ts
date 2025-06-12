// backend\src\jobs\jobs.module.ts
import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
 import { ContainersModule } from '../containers/containers.module';

@Module({
  imports: [
    SubscriptionsModule,
    ContainersModule
  ],
  providers: [TasksService],
})
export class JobsModule { }
// backend\src\operator\operator.module.ts
import { Module } from '@nestjs/common';
import { OperatorController } from './operator.controller';
import { UsersModule } from '../users/users.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { AssignmentsModule } from '../assignments/assignments.module';

@Module({
  controllers: [OperatorController],
  imports: [UsersModule, AssignmentsModule, IncidentsModule], 
})
export class OperatorModule {}
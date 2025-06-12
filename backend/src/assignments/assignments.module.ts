// backend/src/assignments/assignments.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperatorAssignment } from './entities/operator-assignment.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { UsersModule } from '../users/users.module';
import { ContainersModule } from '../containers/containers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OperatorAssignment]),
    forwardRef(() => UsersModule),
    forwardRef(() => ContainersModule),
  ],
  providers: [AssignmentsService],
  controllers: [AssignmentsController], 
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
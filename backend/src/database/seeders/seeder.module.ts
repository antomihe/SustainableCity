// backend\src\database\seeders\seeder.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { User } from '../../users/entities/user.entity';
import { Container } from '../../containers/entities/container.entity';
import { UsersModule } from '../../users/users.module'; 
import { ConfigModule } from '@nestjs/config';
import { OperatorAssignment } from '../../assignments/entities/operator-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Container, OperatorAssignment]),
    UsersModule, 
    ConfigModule, 
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
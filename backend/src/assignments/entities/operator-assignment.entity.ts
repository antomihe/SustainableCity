// backend/src/assignments/entities/operator-assignment.entity.ts
import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../users/entities/user.entity"; // El Operario es un User con rol OPERATOR
import { Container } from "../../containers/entities/container.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Index,
} from "typeorm";

@Entity('operator_assignments')
@Index(['operatorId', 'containerId'], { unique: true }) 
export class OperatorAssignment {
  @ApiProperty({ description: 'Unique identifier for the assignment' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'operator_id', type: 'uuid' })
  operatorId: string; 

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) 
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @Column({ name: 'container_id', type: 'uuid' })
  containerId: string; 

  @ApiProperty({ type: () => Container })
  @ManyToOne(() => Container, { onDelete: 'CASCADE' }) 
  @JoinColumn({ name: 'container_id' })
  container: Container;
  
  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;
}
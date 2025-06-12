// backend/src/users/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToOne } from 'typeorm';
import { Role } from '../enums/role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({ example: 'c1b2a3d4-e5f6-7890-1234-567890abcdef', description: 'Unique identifier for the user' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email, must be unique' })
  @Index({ unique: true })
  @Column({ unique: true, type: 'varchar', length: 255 }) 
  email: string;

  @Column({ nullable: true, select: false }) 
  password?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @Column({ type: 'varchar', length: 255 }) 
  name: string; 

  @ApiProperty({ enum: Role, example: Role.Student, description: 'User role' })
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Student,
  })
  role: Role;


  @ApiProperty({ description: 'Indicates if the user account is active', default: true })
  @Column({ type: 'boolean', default: true }) 
  isActive: boolean; 

  @Column({ name: 'password_reset_expires', type: 'timestamp with time zone', nullable: true, select: false, default: null })
  passwordResetExpires?: Date | null;

  @Column({ name: 'requires_password_set', type: 'boolean', default: false , select: false })
  requiresPasswordSet: boolean;

  @ApiProperty({ description: 'Timestamp of user creation' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp of last user update' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  constructor() {
    this.isActive = true;
    this.requiresPasswordSet = false;
  }
}
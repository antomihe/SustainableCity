// backend\src\containers\entities\container.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ContainerStatus } from '../enums/container-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { ContainerType } from '../enums/container-type.enum';

@Entity('containers')
export class Container {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Edificio A - Planta Baja', description: 'Location description of the container' })
  @Column()
  location: string; 

  @ApiProperty({ example: { lat: 40.7128, lng: -74.0060 }, description: 'Geographical coordinates {lat, lng}' })
  @Column('jsonb' , { name: 'coordinates' }) 
  coordinates: { lat: number; lng: number };

  @ApiProperty({ example: 100, description: 'Capacity in liters or units' })
  @Column({ type: 'int', default: 100 })
  capacity: number;

  @ApiProperty({ example: 75, description: 'Current fill level percentage' })
  @Column({ type: 'int', default: 0 })
  fillLevel: number; // Percentage 0-100

  @ApiProperty({ enum: ContainerType, example: 'RECYCLING', description: 'Type of container' })
  @Column({
    type: 'enum',
    enum: ContainerType,
  })
  type: ContainerType;

  @ApiProperty({ enum: ContainerStatus, example: ContainerStatus.OK, description: 'Current status of the container' })
  @Column({
    type: 'enum',
    enum: ContainerStatus,
    default: ContainerStatus.OK,
  })
  status: ContainerStatus;

  @ApiProperty({ description: 'Description of the incident if any', nullable: true })
  @Column({ type: 'text', nullable: true })
  incidentDescription?: string;

  @ApiProperty({ description: 'Timestamp of the last time the container was emptied', nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'last_emptied_at' })
  lastEmptiedAt?: Date;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
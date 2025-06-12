// backend\src\subscriptions\entities\subscription.entity.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('subscriptions')
export class Subscription {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'student@example.com', description: 'Email of the subscriber' })
  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @ApiPropertyOptional({ example: 'es', description: 'Language preference of the subscriber (e.g., "en", "es")' })
  @Column({ length: 10, default: 'es' }) 
  language: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'subscribed_at' })
  subscribedAt: Date;
}
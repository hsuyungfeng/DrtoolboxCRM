import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('points_config')
export class PointsConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  configKey: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  configValue: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

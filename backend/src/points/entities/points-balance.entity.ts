import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  Unique,
} from 'typeorm';

@Entity('points_balance')
@Unique(['customerId', 'customerType', 'clinicId'])
export class PointsBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  customerId: string;

  @Column({ type: 'varchar', length: 20 })
  customerType: string; // 'staff' | 'patient'

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number; // 當前餘額

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarned: number; // 累計獲得點數

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRedeemed: number; // 累計使用點數

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @VersionColumn()
  version: number; // 樂觀鎖

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

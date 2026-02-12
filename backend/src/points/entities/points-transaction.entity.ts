import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('points_transaction')
export class PointsTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  customerId: string; // 持有點數的人 ID (Staff 或 Patient)

  @Column({ type: 'varchar', length: 20 })
  customerType: string; // 類型 ('staff' | 'patient')

  @Column({ type: 'varchar', length: 50 })
  type: string; // 交易類型 (earn_referral, redeem, expire, manual_adjust)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // 點數變動（正數為增加，負數為扣減）

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balance: number; // 交易後餘額

  @Column({ type: 'varchar', length: 50 })
  source: string; // 來源 (referral, treatment, manual)

  @Column({ type: 'varchar', length: 32, nullable: true })
  referralId: string; // 關聯的推薦記錄 ID

  @Column({ type: 'varchar', length: 32, nullable: true })
  treatmentId: string; // 關聯的療程 ID

  @Column({ type: 'varchar', length: 32 })
  clinicId: string; // 所屬診所

  @Column({ type: 'text', nullable: true })
  notes: string; // 備註

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from './entities/referral.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Staff } from '../staff/entities/staff.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { ReferralService } from './services/referral.service';
import { ReferralController } from './controllers/referral.controller';
import { ReferralEventListener } from './listeners/referral-event.listener';
import { PointsModule } from '../points/points.module';

/**
 * ReferralsModule - 推薦系統模組
 *
 * 提供推薦相關的業務邏輯、事件監聽和 REST API
 *
 * 核心功能：
 * - 創建和管理推薦記錄
 * - 推薦轉化（當患者完成首次療程時）
 * - 自動獎勵推薦人點數
 * - 推薦統計和分析
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Referral, Patient, Staff, Treatment]),
    PointsModule,
  ],
  providers: [ReferralService, ReferralEventListener],
  controllers: [ReferralController],
  exports: [ReferralService],
})
export class ReferralsModule {}

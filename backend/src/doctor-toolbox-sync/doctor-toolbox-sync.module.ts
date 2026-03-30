import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { SyncPatientIndex } from './entities/sync-patient-index.entity';

/**
 * DoctorToolboxSyncModule
 *
 * 管理與 Doctor Toolbox 系統的雙向同步
 *
 * 功能：
 * - Webhook 端點接收 Doctor Toolbox 事件
 * - 患者資料同步（Toolbox → CRM 和 CRM → Toolbox）
 * - 衝突偵測與解決
 * - 初始診所遷移（批量匯入）
 * - 同步審計與監控
 *
 * 多診所隔離：所有操作透過 clinicId 隔離
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      SyncPatientIndex,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class DoctorToolboxSyncModule {}

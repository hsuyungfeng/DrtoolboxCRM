import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { SyncPatientIndex } from './entities/sync-patient-index.entity';
import { MigrationProgress } from './entities/migration-progress.entity';
import { SyncPatientService } from './services/sync-patient.service';
import { RetryService } from './services/retry.service';
import { SyncIndexService } from './services/sync-index.service';
import { BulkExportService } from './services/bulk-export.service';
import { MigrationProgressService } from './services/migration-progress.service';
import { MigrationController } from './controllers/migration.controller';

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
      MigrationProgress,
    ]),
  ],
  controllers: [MigrationController],
  providers: [
    SyncPatientService,
    RetryService,
    SyncIndexService,
    BulkExportService,
    MigrationProgressService,
  ],
  exports: [TypeOrmModule, SyncPatientService, RetryService, SyncIndexService],
})
export class DoctorToolboxSyncModule {}

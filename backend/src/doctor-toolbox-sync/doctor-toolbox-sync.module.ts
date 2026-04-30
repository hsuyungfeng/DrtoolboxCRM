import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { PatientsModule } from '../patients/patients.module';
import { SyncPatientIndex } from './entities/sync-patient-index.entity';
import { SyncOutboundLog } from './entities/sync-outbound-log.entity';
import { MigrationProgress } from './entities/migration-progress.entity';
import { ReconciliationReport } from './entities/reconciliation-report.entity';
import { SyncAuditLog } from '../common/entities/sync-audit-log.entity';
import { SyncPatientService } from './services/sync-patient.service';
import { SyncOutboundService } from './services/sync-outbound.service';
import { RetryService } from './services/retry.service';
import { SyncIndexService } from './services/sync-index.service';
import { BulkExportService } from './services/bulk-export.service';
import { MigrationProgressService } from './services/migration-progress.service';
import { SyncAuditService } from './services/sync-audit.service';
import { SyncMonitoringService } from './services/sync-monitoring.service';
import { MigrationController } from './controllers/migration.controller';
import { SyncAuditController } from './controllers/sync-audit.controller';
import { SyncWebhookController } from './controllers/sync-webhook.controller';
import { SyncOutboundListener } from './listeners/sync-outbound.listener';

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
    PatientsModule,
    TypeOrmModule.forFeature([
      Patient,
      SyncPatientIndex,
      SyncOutboundLog,
      MigrationProgress,
      ReconciliationReport,
      SyncAuditLog,
    ]),
  ],
  controllers: [MigrationController, SyncAuditController, SyncWebhookController],
  providers: [
    SyncPatientService,
    SyncOutboundService,
    RetryService,
    SyncIndexService,
    BulkExportService,
    MigrationProgressService,
    SyncAuditService,
    SyncMonitoringService,
    SyncOutboundListener,
  ],
  exports: [
    TypeOrmModule,
    SyncPatientService,
    SyncOutboundService,
    RetryService,
    SyncIndexService,
    SyncAuditService,
  ],
})
export class DoctorToolboxSyncModule {}

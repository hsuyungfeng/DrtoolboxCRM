import { Test, TestingModule } from '@nestjs/testing';
import { BulkExportService } from '../services/bulk-export.service';
import { SyncPatientService } from '../services/sync-patient.service';
import { RetryService } from '../services/retry.service';
import { MigrationProgressService } from '../services/migration-progress.service';
import { MigrationProgress } from '../entities/migration-progress.entity';

describe('BulkExportService', () => {
  let service: BulkExportService;
  let syncPatientService: jest.Mocked<SyncPatientService>;
  let retryService: jest.Mocked<RetryService>;
  let migrationProgressService: jest.Mocked<MigrationProgressService>;

  const clinicId = 'clinic-migration-test';

  const makeMockProgress = (overrides: Partial<MigrationProgress> = {}): MigrationProgress => {
    const p = new MigrationProgress();
    p.id = 'progress-1';
    p.clinicId = clinicId;
    p.totalPatients = 3;
    p.processedPatients = 0;
    p.failedCount = 0;
    p.status = 'in-progress';
    p.startedAt = new Date();
    p.lastBatchId = null;
    Object.assign(p, overrides);
    return p;
  };

  beforeEach(async () => {
    process.env.DOCTOR_TOOLBOX_API_URL = 'http://test-toolbox.local';

    syncPatientService = {
      syncFromToolbox: jest.fn(),
    } as any;

    retryService = {
      executeWithRetry: jest.fn(),
    } as any;

    migrationProgressService = {
      startProgress: jest.fn(),
      updateProgress: jest.fn(),
      markComplete: jest.fn(),
      markFailed: jest.fn(),
      getProgress: jest.fn(),
      getProgressPercentage: jest.fn(),
      getEstimatedTimeRemaining: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkExportService,
        { provide: SyncPatientService, useValue: syncPatientService },
        { provide: RetryService, useValue: retryService },
        { provide: MigrationProgressService, useValue: migrationProgressService },
      ],
    }).compile();

    service = module.get<BulkExportService>(BulkExportService);
  });

  it('應該被定義', () => {
    expect(service).toBeDefined();
  });

  describe('startMigration', () => {
    it('應成功完成完整遷移流程', async () => {
      const toolboxPatients = [
        { id: 'tp-1', name: '王小明', idNumber: 'A001', phone: '0911111111', email: 'a@test.com' },
        { id: 'tp-2', name: '李小華', idNumber: 'A002', phone: '0922222222', email: 'b@test.com' },
      ];

      const initialProgress = makeMockProgress({ totalPatients: 2 });
      const updatedProgress = makeMockProgress({ totalPatients: 2, processedPatients: 2 });
      const completedProgress = makeMockProgress({ totalPatients: 2, processedPatients: 2, status: 'completed' });

      retryService.executeWithRetry.mockResolvedValue(toolboxPatients);
      migrationProgressService.startProgress.mockResolvedValue(initialProgress);
      migrationProgressService.updateProgress.mockResolvedValue(updatedProgress);
      migrationProgressService.markComplete.mockResolvedValue(completedProgress);
      syncPatientService.syncFromToolbox.mockResolvedValue({} as any);

      const result = await service.startMigration(clinicId);

      expect(result.status).toBe('completed');
      expect(migrationProgressService.startProgress).toHaveBeenCalledWith(clinicId, 2);
      expect(syncPatientService.syncFromToolbox).toHaveBeenCalledTimes(2);
      expect(migrationProgressService.markComplete).toHaveBeenCalledWith(clinicId);
    });

    it('應在 DOCTOR_TOOLBOX_API_URL 未設定時拋出錯誤', async () => {
      const originalUrl = process.env.DOCTOR_TOOLBOX_API_URL;
      delete process.env.DOCTOR_TOOLBOX_API_URL;

      migrationProgressService.markFailed.mockResolvedValue(makeMockProgress({ status: 'failed' }));

      await expect(service.startMigration(clinicId)).rejects.toThrow('DOCTOR_TOOLBOX_API_URL not configured');

      if (originalUrl) process.env.DOCTOR_TOOLBOX_API_URL = originalUrl;
    });

    it('應在個別患者同步失敗時繼續（fail-soft）', async () => {
      const toolboxPatients = [
        { id: 'tp-1', name: '成功患者', idNumber: 'A001', phone: '0911111111', email: 'ok@test.com' },
        { id: 'tp-2', name: '失敗患者', idNumber: 'A002', phone: '0922222222', email: 'fail@test.com' },
        { id: 'tp-3', name: '再次成功', idNumber: 'A003', phone: '0933333333', email: 'ok2@test.com' },
      ];

      const progress = makeMockProgress({ totalPatients: 3 });
      const completedProgress = makeMockProgress({ totalPatients: 3, processedPatients: 3, status: 'completed' });

      retryService.executeWithRetry.mockResolvedValue(toolboxPatients);
      migrationProgressService.startProgress.mockResolvedValue(progress);
      migrationProgressService.updateProgress.mockResolvedValue(progress);
      migrationProgressService.markComplete.mockResolvedValue(completedProgress);

      syncPatientService.syncFromToolbox
        .mockResolvedValueOnce({} as any)  // 患者1 成功
        .mockRejectedValueOnce(new Error('sync failed')) // 患者2 失敗
        .mockResolvedValueOnce({} as any); // 患者3 成功

      const result = await service.startMigration(clinicId);

      expect(result.status).toBe('completed');
      expect(syncPatientService.syncFromToolbox).toHaveBeenCalledTimes(3);
    });
  });

  describe('resumeMigration', () => {
    it('應從中斷點繼續遷移', async () => {
      const toolboxPatients = Array.from({ length: 60 }, (_, i) => ({
        id: `tp-${i}`,
        name: `患者${i}`,
        idNumber: `A${String(i).padStart(3, '0')}`,
        phone: `091${String(i).padStart(7, '0')}`,
        email: `p${i}@test.com`,
      }));

      const pausedProgress = makeMockProgress({
        totalPatients: 60,
        processedPatients: 50,
        status: 'in-progress',
        lastBatchId: 'batch-1',
      });
      const completedProgress = makeMockProgress({ totalPatients: 60, processedPatients: 60, status: 'completed' });

      migrationProgressService.getProgress.mockResolvedValue(pausedProgress);
      retryService.executeWithRetry.mockResolvedValue(toolboxPatients);
      migrationProgressService.updateProgress.mockResolvedValue(pausedProgress);
      migrationProgressService.markComplete.mockResolvedValue(completedProgress);
      syncPatientService.syncFromToolbox.mockResolvedValue({} as any);

      const result = await service.resumeMigration(clinicId);

      expect(result.status).toBe('completed');
      // 只同步從 batch-1 之後的 10 個患者（50 已處理）
      expect(syncPatientService.syncFromToolbox).toHaveBeenCalledTimes(10);
    });

    it('應在遷移已完成時直接返回', async () => {
      const completedProgress = makeMockProgress({ status: 'completed' });
      migrationProgressService.getProgress.mockResolvedValue(completedProgress);

      const result = await service.resumeMigration(clinicId);

      expect(result.status).toBe('completed');
      expect(retryService.executeWithRetry).not.toHaveBeenCalled();
    });

    it('應在找不到遷移記錄時拋出錯誤', async () => {
      migrationProgressService.getProgress.mockResolvedValue(null);

      await expect(service.resumeMigration(clinicId)).rejects.toThrow(
        `No migration found for clinicId: ${clinicId}`,
      );
    });
  });

  describe('abortMigration', () => {
    it('應標記遷移為失敗', async () => {
      migrationProgressService.markFailed.mockResolvedValue(
        makeMockProgress({ status: 'failed' }),
      );

      await service.abortMigration(clinicId);

      expect(migrationProgressService.markFailed).toHaveBeenCalledWith(clinicId);
    });
  });
});

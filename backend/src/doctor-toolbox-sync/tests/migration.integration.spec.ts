import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MigrationProgressService } from '../services/migration-progress.service';
import { MigrationProgress } from '../entities/migration-progress.entity';

describe('MigrationProgressService Integration', () => {
  let service: MigrationProgressService;
  let repository: Repository<MigrationProgress>;

  const clinicId = 'clinic-integration-test';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [MigrationProgress],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([MigrationProgress]),
      ],
      providers: [MigrationProgressService],
    }).compile();

    service = module.get<MigrationProgressService>(MigrationProgressService);
    repository = module.get<Repository<MigrationProgress>>(
      getRepositoryToken(MigrationProgress),
    );
  });

  afterEach(async () => {
    await repository.clear();
  });

  describe('完整遷移生命週期', () => {
    it('應建立、更新、完成遷移進度', async () => {
      // 開始
      const progress = await service.startProgress(clinicId, 100);
      expect(progress.clinicId).toBe(clinicId);
      expect(progress.totalPatients).toBe(100);
      expect(progress.status).toBe('in-progress');
      expect(progress.processedPatients).toBe(0);

      // 更新進度（批次1：50個）
      const after50 = await service.updateProgress(clinicId, 50, 0, 'batch-1');
      expect(after50.processedPatients).toBe(50);
      expect(after50.failedCount).toBe(0);
      expect(after50.lastBatchId).toBe('batch-1');
      expect(after50.getProgressPercentage()).toBe(50);

      // 更新進度（批次2：含2個失敗）
      const after100 = await service.updateProgress(clinicId, 100, 2, 'batch-2');
      expect(after100.processedPatients).toBe(100);
      expect(after100.failedCount).toBe(2);
      expect(after100.getProgressPercentage()).toBe(100);

      // 完成
      const completed = await service.markComplete(clinicId);
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();
    });

    it('應正確累加失敗計數', async () => {
      await service.startProgress(clinicId, 100);

      await service.updateProgress(clinicId, 30, 3, 'batch-1');
      await service.updateProgress(clinicId, 60, 2, 'batch-2');

      const progress = await service.getProgress(clinicId);
      expect(progress.failedCount).toBe(5); // 3 + 2 累加
    });

    it('應在失敗時標記為 failed', async () => {
      await service.startProgress(clinicId, 100);
      await service.updateProgress(clinicId, 30, 0, 'batch-1');

      const failed = await service.markFailed(clinicId);
      expect(failed.status).toBe('failed');
      expect(failed.processedPatients).toBe(30);
    });
  });

  describe('進度百分比計算', () => {
    it('應計算正確的百分比', async () => {
      const p = await service.startProgress(clinicId, 200);
      expect(p.getProgressPercentage()).toBe(0);

      await service.updateProgress(clinicId, 50, 0);
      const p50 = await service.getProgress(clinicId);
      expect(p50.getProgressPercentage()).toBe(25);

      await service.updateProgress(clinicId, 200, 0);
      const p100 = await service.getProgress(clinicId);
      expect(p100.getProgressPercentage()).toBe(100);
    });

    it('totalPatients 為 0 時百分比應為 0', async () => {
      await service.startProgress(clinicId, 0);
      const p = await service.getProgress(clinicId);
      expect(p.getProgressPercentage()).toBe(0);
    });
  });

  describe('getProgress / getProgressPercentage', () => {
    it('無記錄時 getProgress 應回傳 null', async () => {
      const result = await service.getProgress('non-existent-clinic');
      expect(result).toBeNull();
    });

    it('無記錄時 getProgressPercentage 應回傳 0', async () => {
      const pct = await service.getProgressPercentage('non-existent-clinic');
      expect(pct).toBe(0);
    });
  });

  describe('多診所隔離', () => {
    it('不同診所的遷移應互相隔離', async () => {
      const clinic1 = 'isolation-clinic-1';
      const clinic2 = 'isolation-clinic-2';

      await service.startProgress(clinic1, 100);
      await service.startProgress(clinic2, 200);

      await service.updateProgress(clinic1, 50, 0, 'batch-1');

      const p1 = await service.getProgress(clinic1);
      const p2 = await service.getProgress(clinic2);

      expect(p1.processedPatients).toBe(50);
      expect(p1.totalPatients).toBe(100);
      expect(p2.processedPatients).toBe(0);
      expect(p2.totalPatients).toBe(200);
    });
  });
});

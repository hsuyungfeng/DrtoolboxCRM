import { Test, TestingModule } from '@nestjs/testing';
import { SyncMonitoringService } from '../services/sync-monitoring.service';
import { SyncAuditService } from '../services/sync-audit.service';

describe('SyncMonitoringService', () => {
  let service: SyncMonitoringService;
  let auditService: SyncAuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncMonitoringService,
        {
          provide: SyncAuditService,
          useValue: {
            queryFailures: jest.fn(),
            queryByAction: jest.fn(),
            queryByDateRange: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SyncMonitoringService>(SyncMonitoringService);
    auditService = module.get<SyncAuditService>(SyncAuditService);
  });

  describe('checkFailurePattern', () => {
    it('should return alert when >= 3 failures detected', async () => {
      const failures = [
        { timestamp: new Date(), id: '1' },
        { timestamp: new Date(), id: '2' },
        { timestamp: new Date(), id: '3' },
      ];

      jest
        .spyOn(auditService, 'queryFailures')
        .mockResolvedValue(failures as any);

      const result = await service.checkFailurePattern('clinic-1');

      expect(result.hasAlert).toBe(true);
      expect(result.failureCount).toBe(3);
      expect(result.lastFailureTime).toBeDefined();
    });

    it('should not return alert when < 3 failures', async () => {
      const failures = [
        { timestamp: new Date(), id: '1' },
        { timestamp: new Date(), id: '2' },
      ];

      jest
        .spyOn(auditService, 'queryFailures')
        .mockResolvedValue(failures as any);

      const result = await service.checkFailurePattern('clinic-1');

      expect(result.hasAlert).toBe(false);
      expect(result.failureCount).toBe(2);
    });

    it('should return graceful default on error', async () => {
      jest
        .spyOn(auditService, 'queryFailures')
        .mockRejectedValue(new Error('Database error'));

      const result = await service.checkFailurePattern('clinic-1');

      expect(result.hasAlert).toBe(false);
      expect(result.failureCount).toBe(0);
    });
  });

  describe('getRetryPatterns', () => {
    it('should calculate success rate after retry', async () => {
      const retries = [
        { id: '1', action: 'retry-attempt' },
        { id: '2', action: 'retry-attempt' },
      ];
      const successes = [
        { id: '3', action: 'sync-success', eventData: { retriedCount: 1 } },
        { id: '4', action: 'sync-success', eventData: { retriedCount: 0 } },
      ];

      jest
        .spyOn(auditService, 'queryByAction')
        .mockImplementation((clinic, action) => {
          if (action === 'retry-attempt') return Promise.resolve(retries as any);
          return Promise.resolve(successes as any);
        });

      const result = await service.getRetryPatterns('clinic-1');

      expect(result.avgRetriesPerSync).toBe(1);
      expect(result.successRateAfterRetry).toBeGreaterThanOrEqual(0);
    });

    it('should return zeros when no syncs exist', async () => {
      jest
        .spyOn(auditService, 'queryByAction')
        .mockResolvedValue([] as any);

      const result = await service.getRetryPatterns('clinic-1');

      expect(result.avgRetriesPerSync).toBe(0);
      expect(result.successRateAfterRetry).toBe(0);
    });
  });

  describe('getClinicSyncStats', () => {
    it('should aggregate sync statistics over time range', async () => {
      const logs = [
        {
          id: '1',
          action: 'sync-success',
          status: 'success',
          eventData: { syncTime: 1000 },
        },
        {
          id: '2',
          action: 'sync-success',
          status: 'success',
          eventData: { syncTime: 1200 },
        },
        {
          id: '3',
          action: 'sync-failed',
          status: 'failed',
          eventData: { syncTime: 500 },
        },
      ];

      jest
        .spyOn(auditService, 'queryByDateRange')
        .mockResolvedValue(logs as any);

      const result = await service.getClinicSyncStats('clinic-1', 7);

      expect(result.totalSyncs).toBe(3);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.avgSyncTime).toBeGreaterThan(0);
    });

    it('should return zeros when no logs exist', async () => {
      jest
        .spyOn(auditService, 'queryByDateRange')
        .mockResolvedValue([] as any);

      const result = await service.getClinicSyncStats('clinic-1', 7);

      expect(result.totalSyncs).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('multi-clinic isolation', () => {
    it('should query with clinic filter', async () => {
      jest
        .spyOn(auditService, 'queryFailures')
        .mockResolvedValue([] as any);

      await service.checkFailurePattern('clinic-1');

      expect(auditService.queryFailures).toHaveBeenCalledWith('clinic-1', 24);
    });
  });
});

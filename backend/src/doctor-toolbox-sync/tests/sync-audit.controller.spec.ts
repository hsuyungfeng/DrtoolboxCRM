import { Test, TestingModule } from '@nestjs/testing';
import { SyncAuditController } from '../controllers/sync-audit.controller';
import { SyncAuditService } from '../services/sync-audit.service';
import { SyncMonitoringService } from '../services/sync-monitoring.service';

describe('SyncAuditController', () => {
  let controller: SyncAuditController;
  let auditService: SyncAuditService;
  let monitoringService: SyncMonitoringService;

  const mockRequest = {
    user: { clinicId: 'clinic-1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncAuditController],
      providers: [
        {
          provide: SyncAuditService,
          useValue: {
            queryByPatient: jest.fn(),
            queryByClinic: jest.fn(),
            queryByDateRange: jest.fn(),
          },
        },
        {
          provide: SyncMonitoringService,
          useValue: {
            getClinicSyncStats: jest.fn(),
            checkFailurePattern: jest.fn(),
            getRetryPatterns: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SyncAuditController>(SyncAuditController);
    auditService = module.get<SyncAuditService>(SyncAuditService);
    monitoringService = module.get<SyncMonitoringService>(SyncMonitoringService);
  });

  describe('getPatientLogs', () => {
    it('should return audit logs for patient', async () => {
      const logs = [
        {
          id: '1',
          clinicId: 'clinic-1',
          patientId: 'patient-1',
          action: 'sync-success',
        },
      ];

      jest.spyOn(auditService, 'queryByPatient').mockResolvedValue(logs as any);

      const result = await controller.getPatientLogs(
        'patient-1',
        100,
        mockRequest,
      );

      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(logs);
      expect(result.count).toBe(1);
      expect(auditService.queryByPatient).toHaveBeenCalledWith(
        'clinic-1',
        'patient-1',
        100,
      );
    });
  });

  describe('getClinicLogs', () => {
    it('should return clinic logs when no date range provided', async () => {
      const logs = [
        {
          id: '1',
          clinicId: 'clinic-1',
          action: 'sync-success',
        },
      ];

      jest.spyOn(auditService, 'queryByClinic').mockResolvedValue(logs as any);

      const result = await controller.getClinicLogs(mockRequest, 1000, undefined, undefined);

      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(logs);
      expect(auditService.queryByClinic).toHaveBeenCalledWith('clinic-1', 1000);
    });

    it('should return logs within date range when provided', async () => {
      const logs = [
        {
          id: '1',
          clinicId: 'clinic-1',
          action: 'sync-success',
        },
      ];

      jest
        .spyOn(auditService, 'queryByDateRange')
        .mockResolvedValue(logs as any);

      const result = await controller.getClinicLogs(
        mockRequest,
        1000,
        '2026-03-01',
        '2026-03-31',
      );

      expect(result.statusCode).toBe(200);
      expect(auditService.queryByDateRange).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return sync stats and failure alerts', async () => {
      const stats = {
        totalSyncs: 100,
        successful: 95,
        failed: 5,
        avgSyncTime: 1200,
      };

      const failureAlert = {
        hasAlert: false,
        failureCount: 2,
      };

      jest
        .spyOn(monitoringService, 'getClinicSyncStats')
        .mockResolvedValue(stats);
      jest
        .spyOn(monitoringService, 'checkFailurePattern')
        .mockResolvedValue(failureAlert);

      const result = await controller.getStats(mockRequest, '7');

      expect(result.statusCode).toBe(200);
      expect(result.data.stats).toEqual(stats);
      expect(result.data.failureAlert).toEqual(failureAlert);
    });
  });

  describe('getRetryPatterns', () => {
    it('should return retry patterns', async () => {
      const patterns = {
        avgRetriesPerSync: 0.5,
        successRateAfterRetry: 0.8,
      };

      jest
        .spyOn(monitoringService, 'getRetryPatterns')
        .mockResolvedValue(patterns);

      const result = await controller.getRetryPatterns(mockRequest);

      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(patterns);
    });
  });

  describe('multi-clinic isolation', () => {
    it('should use clinicId from JWT in all queries', async () => {
      jest.spyOn(auditService, 'queryByClinic').mockResolvedValue([]);

      await controller.getClinicLogs(mockRequest, 1000, undefined, undefined);

      const callArg = (auditService.queryByClinic as jest.Mock).mock.calls[0][0];
      expect(callArg).toBe('clinic-1');
    });
  });
});

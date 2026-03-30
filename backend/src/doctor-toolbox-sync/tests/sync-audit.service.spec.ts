import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncAuditService } from '../services/sync-audit.service';
import { SyncAuditLog } from '../../common/entities/sync-audit-log.entity';

describe('SyncAuditService', () => {
  let service: SyncAuditService;
  let repository: Repository<SyncAuditLog>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncAuditService,
        {
          provide: getRepositoryToken(SyncAuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SyncAuditService>(SyncAuditService);
    repository = module.get<Repository<SyncAuditLog>>(
      getRepositoryToken(SyncAuditLog),
    );
  });

  describe('logEvent', () => {
    it('should create and save audit log record', async () => {
      const event = {
        clinicId: 'clinic-1',
        patientId: 'patient-1',
        action: 'sync-success',
        source: 'toolbox',
        status: 'success',
        eventData: { syncTime: 1200 },
      };

      const createdLog = { id: '1', ...event, timestamp: new Date() };
      jest.spyOn(repository, 'create').mockReturnValue(createdLog as any);
      jest.spyOn(repository, 'save').mockResolvedValue(createdLog as any);

      const result = await service.logEvent(event);

      expect(repository.create).toHaveBeenCalledWith(event);
      expect(repository.save).toHaveBeenCalledWith(createdLog);
      expect(result).toEqual(createdLog);
    });
  });

  describe('queryByPatient', () => {
    it('should return audit logs for patient', async () => {
      const logs = [
        {
          id: '1',
          clinicId: 'clinic-1',
          patientId: 'patient-1',
          action: 'sync-success',
          timestamp: new Date(),
        },
      ];
      jest.spyOn(repository, 'find').mockResolvedValue(logs as any);

      const result = await service.queryByPatient('clinic-1', 'patient-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { clinicId: 'clinic-1', patientId: 'patient-1' },
        order: { timestamp: 'DESC' },
        take: 100,
      });
      expect(result).toEqual(logs);
    });
  });

  describe('queryByClinic', () => {
    it('should return all audit logs for clinic', async () => {
      const logs = [
        {
          id: '1',
          clinicId: 'clinic-1',
          action: 'sync-success',
          timestamp: new Date(),
        },
        {
          id: '2',
          clinicId: 'clinic-1',
          action: 'webhook-received',
          timestamp: new Date(),
        },
      ];
      jest.spyOn(repository, 'find').mockResolvedValue(logs as any);

      const result = await service.queryByClinic('clinic-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { clinicId: 'clinic-1' },
        order: { timestamp: 'DESC' },
        take: 1000,
      });
      expect(result).toEqual(logs);
    });
  });

  describe('queryByDateRange', () => {
    it('should return logs within date range', async () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');
      const logs = [
        {
          id: '1',
          clinicId: 'clinic-1',
          timestamp: new Date('2026-03-15'),
        },
      ];
      jest.spyOn(repository, 'find').mockResolvedValue(logs as any);

      const result = await service.queryByDateRange(
        'clinic-1',
        startDate,
        endDate,
      );

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(logs);
    });
  });

  describe('queryByAction', () => {
    it('should return logs for specific action', async () => {
      const logs = [
        {
          id: '1',
          clinicId: 'clinic-1',
          action: 'sync-success',
          timestamp: new Date(),
        },
      ];
      jest.spyOn(repository, 'find').mockResolvedValue(logs as any);

      const result = await service.queryByAction('clinic-1', 'sync-success');

      expect(repository.find).toHaveBeenCalledWith({
        where: { clinicId: 'clinic-1', action: 'sync-success' },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(logs);
    });
  });

  describe('queryFailures', () => {
    it('should return failed sync records from last 24 hours', async () => {
      const logs = [
        {
          id: '1',
          clinicId: 'clinic-1',
          status: 'failed',
          timestamp: new Date(),
        },
      ];
      jest.spyOn(repository, 'find').mockResolvedValue(logs as any);

      const result = await service.queryFailures('clinic-1', 24);

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(logs);
    });
  });

  describe('multi-clinic isolation', () => {
    it('should not return logs from different clinic', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await service.queryByPatient('clinic-1', 'patient-1');

      const callArg = (repository.find as jest.Mock).mock.calls[0][0];
      expect(callArg.where).toHaveProperty('clinicId', 'clinic-1');
    });
  });
});

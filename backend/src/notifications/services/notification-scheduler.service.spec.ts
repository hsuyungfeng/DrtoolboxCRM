import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationService } from './notification.service';
import { TreatmentSession } from '../../treatments/entities/treatment-session.entity';

const mockSessionRepository = {
  createQueryBuilder: jest.fn(),
};

const mockNotificationService = {
  sendMultiChannel: jest.fn(),
};

const buildQueryBuilder = (sessions: any[]) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(sessions),
});

describe('NotificationSchedulerService', () => {
  let service: NotificationSchedulerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationSchedulerService,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: getRepositoryToken(TreatmentSession), useValue: mockSessionRepository },
      ],
    }).compile();
    service = module.get<NotificationSchedulerService>(NotificationSchedulerService);
  });

  describe('sendAppointmentReminders', () => {
    it('找到明天 pending session 時，應呼叫 sendMultiChannel', async () => {
      const mockSession = {
        id: 'session-1',
        treatmentCourse: {
          patient: {
            id: 'patient-1',
            clinicId: 'clinic-1',
            name: '測試患者',
            email: 'test@example.com',
            phoneNumber: '0912345678',
          },
        },
      };
      mockSessionRepository.createQueryBuilder.mockReturnValue(
        buildQueryBuilder([mockSession]),
      );

      await service.sendAppointmentReminders();

      expect(mockNotificationService.sendMultiChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'appointment_reminder',
          patient: mockSession.treatmentCourse.patient,
        }),
      );
    });

    it('無明天 session 時，不應呼叫 sendMultiChannel', async () => {
      mockSessionRepository.createQueryBuilder.mockReturnValue(
        buildQueryBuilder([]),
      );
      await service.sendAppointmentReminders();
      expect(mockNotificationService.sendMultiChannel).not.toHaveBeenCalled();
    });

    it('session 無關聯患者時應跳過，不拋出例外', async () => {
      const sessionNoPatient = {
        id: 'session-2',
        treatmentCourse: { patient: null },
      };
      mockSessionRepository.createQueryBuilder.mockReturnValue(
        buildQueryBuilder([sessionNoPatient]),
      );
      await expect(service.sendAppointmentReminders()).resolves.not.toThrow();
      expect(mockNotificationService.sendMultiChannel).not.toHaveBeenCalled();
    });

    it('某個 session 通知失敗時，應繼續處理其他 session', async () => {
      const patient1 = { id: 'p1', clinicId: 'c1', name: '患者一', email: 'a@a.com', phoneNumber: '0911111111' };
      const patient2 = { id: 'p2', clinicId: 'c1', name: '患者二', email: 'b@b.com', phoneNumber: '0922222222' };
      mockSessionRepository.createQueryBuilder.mockReturnValue(
        buildQueryBuilder([
          { id: 's1', treatmentCourse: { patient: patient1 } },
          { id: 's2', treatmentCourse: { patient: patient2 } },
        ]),
      );
      mockNotificationService.sendMultiChannel
        .mockRejectedValueOnce(new Error('第一個失敗'))
        .mockResolvedValueOnce(undefined);

      await expect(service.sendAppointmentReminders()).resolves.not.toThrow();
      expect(mockNotificationService.sendMultiChannel).toHaveBeenCalledTimes(2);
    });
  });
});

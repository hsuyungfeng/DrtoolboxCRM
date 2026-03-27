import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationRecord } from '../entities/notification-record.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';

const mockNotificationRecordRepo = {
  create: jest.fn((dto) => dto),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  }),
  update: jest.fn(),
};

const mockPreferenceRepo = {
  findOne: jest.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;

  const mockPatient = {
    id: 'patient-123',
    clinicId: 'clinic-001',
    name: '測試患者',
    email: 'patient@test.com',
    phoneNumber: '0912345678',
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(NotificationRecord), useValue: mockNotificationRecordRepo },
        { provide: getRepositoryToken(NotificationPreference), useValue: mockPreferenceRepo },
      ],
    }).compile();
    service = module.get<NotificationService>(NotificationService);
  });

  describe('sendMultiChannel', () => {
    it('偏好記錄不存在時，應預設全渠道發送', async () => {
      mockPreferenceRepo.findOne.mockResolvedValue(null);
      await service.sendMultiChannel({
        patient: mockPatient,
        eventType: 'course_started',
        title: '療程開始',
        message: '您的療程已開始',
      });
      // email, sms, in_app 各儲存一筆
      expect(mockNotificationRecordRepo.save).toHaveBeenCalledTimes(3);
    });

    it('emailEnabled=false 時不應儲存 email 記錄', async () => {
      mockPreferenceRepo.findOne.mockResolvedValue({
        emailEnabled: false,
        smsEnabled: true,
        inAppEnabled: true,
        notifyOnCourseStart: true,
      });
      await service.sendMultiChannel({
        patient: mockPatient,
        eventType: 'course_started',
        title: '療程開始',
        message: '您的療程已開始',
      });
      const savedChannels = mockNotificationRecordRepo.save.mock.calls.map(
        (call) => call[0].channel,
      );
      expect(savedChannels).not.toContain('email');
      expect(savedChannels).toContain('sms');
      expect(savedChannels).toContain('in_app');
    });

    it('notifyOnCourseStart=false 時不應發送任何渠道', async () => {
      mockPreferenceRepo.findOne.mockResolvedValue({
        emailEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
        notifyOnCourseStart: false,
      });
      await service.sendMultiChannel({
        patient: mockPatient,
        eventType: 'course_started',
        title: '療程開始',
        message: '您的療程已開始',
      });
      expect(mockNotificationRecordRepo.save).not.toHaveBeenCalled();
    });

    it('患者無 email 時不應嘗試發送 email 渠道', async () => {
      mockPreferenceRepo.findOne.mockResolvedValue(null);
      const patientNoEmail = { ...mockPatient, email: null };
      await service.sendMultiChannel({
        patient: patientNoEmail,
        eventType: 'session_completed',
        title: '進度更新',
        message: '您的一次療程已完成',
      });
      const savedChannels = mockNotificationRecordRepo.save.mock.calls.map(
        (call) => call[0].channel,
      );
      expect(savedChannels).not.toContain('email');
    });
  });

  describe('sendChurnRiskAlert（向後相容）', () => {
    it('應回傳 Notification 物件而不拋出例外', async () => {
      const risk = {
        patientId: 'p1',
        patientName: '測試患者',
        riskLevel: 'high' as const,
        riskScore: 80,
        reasons: ['久未回診'],
        recommendedActions: ['主動聯繫'],
      };
      const result = await service.sendChurnRiskAlert(risk, 'clinic-001');
      expect(result).toBeDefined();
      expect(result.type).toBe('system');
    });
  });
});

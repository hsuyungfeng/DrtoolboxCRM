import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationEventListener } from './notification-event.listener';
import { NotificationService } from '../services/notification.service';
import { Patient } from '../../patients/entities/patient.entity';

const mockNotificationService = {
  sendMultiChannel: jest.fn(),
};

const mockPatientRepository = {
  findOne: jest.fn(),
};

const mockPatient = {
  id: 'patient-123',
  clinicId: 'clinic-001',
  name: '測試患者',
  email: 'test@example.com',
  phoneNumber: '0912345678',
} as Patient;

describe('NotificationEventListener', () => {
  let listener: NotificationEventListener;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationEventListener,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: getRepositoryToken(Patient), useValue: mockPatientRepository },
      ],
    }).compile();
    listener = module.get<NotificationEventListener>(NotificationEventListener);
  });

  describe('handleCourseStarted（NOTIF-01）', () => {
    it('應查詢患者並呼叫 sendMultiChannel with course_started', async () => {
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      await listener.handleCourseStarted({
        courseId: 'course-1',
        patientId: 'patient-123',
        clinicId: 'clinic-001',
        startedAt: new Date(),
      } as any);
      expect(mockNotificationService.sendMultiChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          patient: mockPatient,
          eventType: 'course_started',
          relatedEntityId: 'course-1',
        }),
      );
    });

    it('患者不存在時應早期返回，不呼叫 sendMultiChannel', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);
      await listener.handleCourseStarted({
        courseId: 'course-1',
        patientId: 'non-existent',
        clinicId: 'clinic-001',
        startedAt: new Date(),
      } as any);
      expect(mockNotificationService.sendMultiChannel).not.toHaveBeenCalled();
    });

    it('sendMultiChannel 拋出例外時不應重新拋出', async () => {
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      mockNotificationService.sendMultiChannel.mockRejectedValue(new Error('發送失敗'));
      await expect(
        listener.handleCourseStarted({
          courseId: 'course-1',
          patientId: 'patient-123',
          clinicId: 'clinic-001',
          startedAt: new Date(),
        } as any),
      ).resolves.not.toThrow();
    });
  });

  describe('handleSessionCompleted（NOTIF-02）', () => {
    it('應呼叫 sendMultiChannel with session_completed', async () => {
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      await listener.handleSessionCompleted({
        sessionId: 'session-1',
        treatmentCourseId: 'course-1',
        patientId: 'patient-123',
        completedAt: new Date(),
      });
      expect(mockNotificationService.sendMultiChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'session_completed',
          relatedEntityId: 'session-1',
        }),
      );
    });
  });

  describe('handleCourseCompleted（NOTIF-03）', () => {
    it('應呼叫 sendMultiChannel with course_completed', async () => {
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);
      await listener.handleCourseCompleted({
        courseId: 'course-1',
        patientId: 'patient-123',
        clinicId: 'clinic-001',
        completedAt: new Date(),
      } as any);
      expect(mockNotificationService.sendMultiChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'course_completed',
          relatedEntityId: 'course-1',
        }),
      );
    });
  });
});

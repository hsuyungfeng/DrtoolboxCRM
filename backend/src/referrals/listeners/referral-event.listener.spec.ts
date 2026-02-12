import { Test, TestingModule } from '@nestjs/testing';
import { ReferralEventListener } from './referral-event.listener';
import { ReferralService } from '../services/referral.service';
import { Logger } from '@nestjs/common';

describe('ReferralEventListener', () => {
  let listener: ReferralEventListener;
  let referralService: ReferralService;

  const mockClinicId = 'clinic-001';
  const mockPatientId = 'patient-456';
  const mockTreatmentId = 'treatment-789';

  const mockTreatmentCreatedEvent = {
    treatmentId: mockTreatmentId,
    patientId: mockPatientId,
    clinicId: mockClinicId,
  };

  const mockReferral = {
    id: 'ref-001',
    status: 'pending',
    pointsAwarded: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralEventListener,
        {
          provide: ReferralService,
          useValue: {
            getReferralByPatient: jest.fn(),
            convertReferral: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<ReferralEventListener>(ReferralEventListener);
    referralService = module.get<ReferralService>(ReferralService);
  });

  describe('handleTreatmentCreated', () => {
    it('應該在治療創建事件時自動轉化推薦', async () => {
      // Arrange
      const getReferralSpy = jest
        .spyOn(referralService, 'getReferralByPatient')
        .mockResolvedValue(mockReferral as any);
      const convertSpy = jest
        .spyOn(referralService, 'convertReferral')
        .mockResolvedValue({ ...mockReferral, status: 'converted' } as any);

      // Act
      await listener.handleTreatmentCreated(mockTreatmentCreatedEvent);

      // Assert
      expect(getReferralSpy).toHaveBeenCalledWith(mockPatientId, mockClinicId);
      expect(convertSpy).toHaveBeenCalledWith('ref-001', mockTreatmentId, mockClinicId);
    });

    it('患者沒有推薦時應該跳過轉化', async () => {
      // Arrange
      const getReferralSpy = jest
        .spyOn(referralService, 'getReferralByPatient')
        .mockResolvedValue(null);
      const convertSpy = jest.spyOn(referralService, 'convertReferral');

      // Act
      await listener.handleTreatmentCreated(mockTreatmentCreatedEvent);

      // Assert
      expect(getReferralSpy).toHaveBeenCalled();
      expect(convertSpy).not.toHaveBeenCalled();
    });

    it('推薦已轉化時應該跳過轉化', async () => {
      // Arrange
      const convertedReferral = { ...mockReferral, status: 'converted' };
      jest.spyOn(referralService, 'getReferralByPatient').mockResolvedValue(convertedReferral as any);
      const convertSpy = jest.spyOn(referralService, 'convertReferral');

      // Act
      await listener.handleTreatmentCreated(mockTreatmentCreatedEvent);

      // Assert
      expect(convertSpy).not.toHaveBeenCalled();
    });

    it('推薦已取消時應該跳過轉化', async () => {
      // Arrange
      const cancelledReferral = { ...mockReferral, status: 'cancelled' };
      jest.spyOn(referralService, 'getReferralByPatient').mockResolvedValue(cancelledReferral as any);
      const convertSpy = jest.spyOn(referralService, 'convertReferral');

      // Act
      await listener.handleTreatmentCreated(mockTreatmentCreatedEvent);

      // Assert
      expect(convertSpy).not.toHaveBeenCalled();
    });

    it('轉化失敗時應該捕捉並記錄錯誤', async () => {
      // Arrange
      jest.spyOn(referralService, 'getReferralByPatient').mockResolvedValue(mockReferral as any);
      const error = new Error('轉化失敗');
      jest.spyOn(referralService, 'convertReferral').mockRejectedValue(error);

      // Act & Assert - 不應拋出異常（被 try-catch 捕捉）
      await expect(listener.handleTreatmentCreated(mockTreatmentCreatedEvent)).resolves.toBeUndefined();
    });
  });
});

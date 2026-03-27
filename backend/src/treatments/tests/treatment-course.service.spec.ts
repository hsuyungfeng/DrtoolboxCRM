/**
 * TreatmentCourseService 單元測試
 * 測試療程套餐服務的業務邏輯、進度計算、醫護人員分配
 * Unit tests for TreatmentCourseService business logic, progress calculation, staff assignment
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TreatmentCourseService } from '../services/treatment-course.service';
import { TreatmentCourse } from '../entities/treatment-course.entity';
import { TreatmentSession } from '../entities/treatment-session.entity';
import { StaffAssignment } from '../entities/staff-assignment.entity';
import { TreatmentCourseTemplateService } from '../services/treatment-course-template.service';
import { TreatmentProgressService } from '../services/treatment-progress.service';
import { PointsService } from '../../points/services/points.service';
import { StaffService } from '../../staff/services/staff.service';
import Decimal from 'decimal.js';

describe('TreatmentCourseService', () => {
  let service: TreatmentCourseService;
  let courseRepository: any;
  let sessionRepository: any;
  let staffAssignmentRepository: any;
  let templateService: any;
  let treatmentProgressService: any;
  let pointsService: any;
  let staffService: any;
  let dataSource: any;

  const mockClinicId = 'clinic-001';
  const mockPatientId = 'patient-001';
  const mockTemplateId = 'tmpl-001';
  const mockCourseId = 'course-001';
  const mockSessionId = 'session-001';
  const mockStaffId = 'staff-001';

  const mockTemplate = {
    id: mockTemplateId,
    name: '10次美容套餐',
    totalSessions: 10,
    totalPrice: new Decimal('5000.00'),
    clinicId: mockClinicId,
    isActive: true,
  };

  const mockCourse = {
    id: mockCourseId,
    patientId: mockPatientId,
    templateId: mockTemplateId,
    status: 'active',
    purchaseAmount: new Decimal('5000.00'),
    pointsRedeemed: new Decimal('0'),
    actualPayment: new Decimal('5000.00'),
    clinicId: mockClinicId,
    purchaseDate: new Date(),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    sessions: [],
  };

  beforeEach(async () => {
    courseRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    sessionRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    staffAssignmentRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    templateService = {
      getTemplateById: jest.fn(),
    };

    treatmentProgressService = {
      calculateProgressPercent: jest.fn(),
      getProgress: jest.fn(),
      isCourseFinallyCompleted: jest.fn(),
      calculateProgressForCourses: jest.fn(),
    };

    pointsService = {
      redeemPoints: jest.fn(),
    };

    staffService = {
      findOne: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentCourseService,
        {
          provide: getRepositoryToken(TreatmentCourse),
          useValue: courseRepository,
        },
        {
          provide: getRepositoryToken(TreatmentSession),
          useValue: sessionRepository,
        },
        {
          provide: getRepositoryToken(StaffAssignment),
          useValue: staffAssignmentRepository,
        },
        {
          provide: TreatmentCourseTemplateService,
          useValue: templateService,
        },
        {
          provide: TreatmentProgressService,
          useValue: treatmentProgressService,
        },
        {
          provide: PointsService,
          useValue: pointsService,
        },
        {
          provide: StaffService,
          useValue: staffService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<TreatmentCourseService>(TreatmentCourseService);
  });

  // ────────────────────────────────────────────────────────────────────
  // createCourse
  // ────────────────────────────────────────────────────────────────────
  describe('createCourse', () => {
    it('應該在事務中建立療程套餐並生成 sessions', async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: mockTemplateId,
        clinicId: mockClinicId,
        pointsToRedeem: 0,
      };

      templateService.getTemplateById.mockResolvedValue(mockTemplate);

      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          save: jest.fn().mockResolvedValueOnce(mockCourse).mockResolvedValue(undefined),
        };
        return cb(mockManager);
      });

      const result = await service.createCourse(dto as any);

      expect(result.id).toBe(mockCourseId);
      expect(templateService.getTemplateById).toHaveBeenCalledWith(mockTemplateId, mockClinicId);
    });

    it('點數抵扣後應計算正確的實際付款金額', async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: mockTemplateId,
        clinicId: mockClinicId,
        pointsToRedeem: 500,
      };

      const courseWithDiscount = {
        ...mockCourse,
        pointsRedeemed: new Decimal('500'),
        actualPayment: new Decimal('4500'),
      };

      templateService.getTemplateById.mockResolvedValue(mockTemplate);
      pointsService.redeemPoints.mockResolvedValue({});

      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          save: jest.fn().mockResolvedValueOnce(courseWithDiscount).mockResolvedValue(undefined),
        };
        return cb(mockManager);
      });

      const result = await service.createCourse(dto as any);

      expect(result.actualPayment.toNumber()).toBe(4500);
      expect(pointsService.redeemPoints).toHaveBeenCalled();
    });

    it('點數抵扣超過套餐價格應拋出 BadRequestException', async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: mockTemplateId,
        clinicId: mockClinicId,
        pointsToRedeem: 9999, // 超過 5000
      };

      templateService.getTemplateById.mockResolvedValue(mockTemplate);

      await expect(service.createCourse(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('模板不存在應拋出 NotFoundException', async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: 'invalid-template',
        clinicId: mockClinicId,
      };

      templateService.getTemplateById.mockResolvedValue(null);

      await expect(service.createCourse(dto as any)).rejects.toThrow(NotFoundException);
    });

    it('patientId 為空應拋出 BadRequestException', async () => {
      const dto = {
        patientId: '',
        templateId: mockTemplateId,
        clinicId: mockClinicId,
      };

      await expect(service.createCourse(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('clinicId 為空應拋出 BadRequestException', async () => {
      const dto = {
        patientId: mockPatientId,
        templateId: mockTemplateId,
        clinicId: '',
      };

      await expect(service.createCourse(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // getCourseById
  // ────────────────────────────────────────────────────────────────────
  describe('getCourseById', () => {
    it('應該成功取得療程（含 sessions）', async () => {
      courseRepository.findOne.mockResolvedValue(mockCourse);

      const result = await service.getCourseById(mockCourseId, mockClinicId);

      expect(result.id).toBe(mockCourseId);
      expect(courseRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCourseId, clinicId: mockClinicId },
        relations: ['sessions', 'sessions.staffAssignments'],
      });
    });

    it('療程不存在應拋出 NotFoundException', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCourseById(mockCourseId, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it('courseId 為空應拋出 BadRequestException', async () => {
      await expect(service.getCourseById('', mockClinicId)).rejects.toThrow(BadRequestException);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // getPatientCourses
  // ────────────────────────────────────────────────────────────────────
  describe('getPatientCourses', () => {
    it('應該回傳患者所有療程', async () => {
      courseRepository.find.mockResolvedValue([mockCourse]);

      const result = await service.getPatientCourses(mockPatientId, mockClinicId);

      expect(result).toHaveLength(1);
      expect(result[0].patientId).toBe(mockPatientId);
    });

    it('無療程時應回傳空陣列', async () => {
      courseRepository.find.mockResolvedValue([]);

      const result = await service.getPatientCourses(mockPatientId, mockClinicId);

      expect(result).toHaveLength(0);
    });

    it('patientId 為空應拋出 BadRequestException', async () => {
      await expect(
        service.getPatientCourses('', mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });

    it('應支援狀態過濾', async () => {
      courseRepository.find.mockResolvedValue([mockCourse]);

      await service.getPatientCourses(mockPatientId, mockClinicId, 'active');

      expect(courseRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // updateCourse
  // ────────────────────────────────────────────────────────────────────
  describe('updateCourse', () => {
    it('應該成功更新療程名稱', async () => {
      const updatedCourse = { ...mockCourse, name: '新套餐名稱' };
      courseRepository.findOne.mockResolvedValue(mockCourse);
      courseRepository.save.mockResolvedValue(updatedCourse);

      const result = await service.updateCourse(mockCourseId, { name: '新套餐名稱' } as any, mockClinicId);

      expect(result.name).toBe('新套餐名稱');
    });

    it('療程不存在應拋出 NotFoundException', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateCourse(mockCourseId, {} as any, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it('更新狀態為 completed 時應設定 completedAt', async () => {
      const courseWithSessions = { ...mockCourse, sessions: [] };
      const completedCourse = { ...courseWithSessions, status: 'completed', completedAt: new Date() };
      courseRepository.findOne.mockResolvedValue(courseWithSessions);
      courseRepository.save.mockResolvedValue(completedCourse);

      const result = await service.updateCourse(mockCourseId, { status: 'completed' } as any, mockClinicId);

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
    });

    it('無效狀態應拋出 BadRequestException', async () => {
      const courseWithSessions = { ...mockCourse, sessions: [] };
      courseRepository.findOne.mockResolvedValue(courseWithSessions);

      await expect(
        service.updateCourse(mockCourseId, { status: 'invalid_status' } as any, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // deleteCourse
  // ────────────────────────────────────────────────────────────────────
  describe('deleteCourse', () => {
    it('未開始的療程應可成功刪除', async () => {
      const courseWithPendingSessions = {
        ...mockCourse,
        sessions: [
          { id: 'session-1', completionStatus: 'pending' },
          { id: 'session-2', completionStatus: 'pending' },
        ],
      };
      courseRepository.findOne.mockResolvedValue(courseWithPendingSessions);
      courseRepository.remove.mockResolvedValue(undefined);

      await service.deleteCourse(mockCourseId, mockClinicId);

      expect(courseRepository.remove).toHaveBeenCalledWith(courseWithPendingSessions);
    });

    it('已開始的療程不能刪除，應拋出 BadRequestException', async () => {
      const startedCourse = {
        ...mockCourse,
        sessions: [
          { id: 'session-1', completionStatus: 'completed' },
          { id: 'session-2', completionStatus: 'pending' },
        ],
      };
      courseRepository.findOne.mockResolvedValue(startedCourse);

      await expect(service.deleteCourse(mockCourseId, mockClinicId)).rejects.toThrow(BadRequestException);
    });

    it('療程不存在應拋出 NotFoundException', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteCourse(mockCourseId, mockClinicId)).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // completeSession
  // ────────────────────────────────────────────────────────────────────
  describe('completeSession', () => {
    it('應該成功完成 session', async () => {
      const mockSession = {
        id: mockSessionId,
        clinicId: mockClinicId,
        treatmentCourseId: mockCourseId,
        completionStatus: 'pending',
        sessionNumber: 1,
        treatmentCourse: mockCourse,
      };
      const courseWithAllCompleted = {
        ...mockCourse,
        sessions: [{ id: mockSessionId, completionStatus: 'completed' }],
      };

      sessionRepository.findOne.mockResolvedValue(mockSession);
      sessionRepository.save.mockResolvedValue({ ...mockSession, completionStatus: 'completed' });
      courseRepository.findOne.mockResolvedValue(courseWithAllCompleted);
      treatmentProgressService.isCourseFinallyCompleted.mockReturnValue(false);

      const result = await service.completeSession(mockSessionId, mockClinicId);

      expect(result.completionStatus).toBe('completed');
    });

    it('所有 sessions 完成時應自動更新療程狀態為 completed', async () => {
      const mockSession = {
        id: mockSessionId,
        clinicId: mockClinicId,
        treatmentCourseId: mockCourseId,
        completionStatus: 'pending',
        treatmentCourse: mockCourse,
      };
      const courseWithAllCompleted = {
        ...mockCourse,
        status: 'active',
        sessions: [
          { id: mockSessionId, completionStatus: 'completed' },
        ],
      };

      sessionRepository.findOne.mockResolvedValue(mockSession);
      sessionRepository.save.mockResolvedValue({ ...mockSession, completionStatus: 'completed' });
      courseRepository.findOne.mockResolvedValue(courseWithAllCompleted);
      treatmentProgressService.isCourseFinallyCompleted.mockReturnValue(true);
      courseRepository.save.mockResolvedValue({ ...courseWithAllCompleted, status: 'completed' });

      await service.completeSession(mockSessionId, mockClinicId);

      expect(courseRepository.save).toHaveBeenCalled();
    });

    it('session 不存在應拋出 NotFoundException', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.completeSession('invalid-session', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // assignStaffToSession
  // ────────────────────────────────────────────────────────────────────
  describe('assignStaffToSession', () => {
    it('應該成功分配醫護人員到 session', async () => {
      const mockSession = { id: mockSessionId, treatmentCourseId: mockCourseId };
      const mockStaff = { id: mockStaffId, clinicId: mockClinicId };
      const mockAssignment = {
        id: 'assignment-001',
        sessionId: mockSessionId,
        staffId: mockStaffId,
        staffRole: 'doctor',
        ppfPercentage: new Decimal(50),
      };

      courseRepository.findOne.mockResolvedValue(mockCourse);
      sessionRepository.findOne.mockResolvedValue(mockSession);
      staffService.findOne.mockResolvedValue(mockStaff);
      staffAssignmentRepository.findOne.mockResolvedValue(null);
      staffAssignmentRepository.create.mockReturnValue(mockAssignment);
      staffAssignmentRepository.save.mockResolvedValue(mockAssignment);

      const result = await service.assignStaffToSession(
        mockCourseId,
        mockSessionId,
        mockStaffId,
        mockClinicId,
        'doctor',
        50,
      );

      expect(result.staffId).toBe(mockStaffId);
    });

    it('已分配相同醫護人員應拋出 BadRequestException', async () => {
      const existingAssignment = { id: 'existing-assignment' };

      courseRepository.findOne.mockResolvedValue(mockCourse);
      sessionRepository.findOne.mockResolvedValue({ id: mockSessionId });
      staffService.findOne.mockResolvedValue({ id: mockStaffId, clinicId: mockClinicId });
      staffAssignmentRepository.findOne.mockResolvedValue(existingAssignment);

      await expect(
        service.assignStaffToSession(mockCourseId, mockSessionId, mockStaffId, mockClinicId, 'doctor', 50),
      ).rejects.toThrow(BadRequestException);
    });

    it('醫護人員不屬於此診所應拋出 NotFoundException', async () => {
      courseRepository.findOne.mockResolvedValue(mockCourse);
      sessionRepository.findOne.mockResolvedValue({ id: mockSessionId });
      staffService.findOne.mockResolvedValue({ id: mockStaffId, clinicId: 'other-clinic' });

      await expect(
        service.assignStaffToSession(mockCourseId, mockSessionId, mockStaffId, mockClinicId, 'doctor', 50),
      ).rejects.toThrow(NotFoundException);
    });

    it('療程不存在應拋出 NotFoundException', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignStaffToSession(mockCourseId, mockSessionId, mockStaffId, mockClinicId, 'doctor', 50),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // getCourseWithProgress
  // ────────────────────────────────────────────────────────────────────
  describe('getCourseWithProgress', () => {
    it('應該回傳療程含進度資訊', async () => {
      const courseWithSessions = {
        ...mockCourse,
        sessions: [
          { id: 'session-1', completionStatus: 'completed' },
          { id: 'session-2', completionStatus: 'pending' },
        ],
      };
      const mockProgress = {
        totalSessions: 2,
        completedSessions: 1,
        pendingSessions: 1,
        progressPercent: 50,
        isCompleted: false,
      };

      courseRepository.findOne.mockResolvedValue(courseWithSessions);
      treatmentProgressService.getProgress.mockReturnValue(mockProgress);

      const result = await service.getCourseWithProgress(mockCourseId, mockClinicId);

      expect(result.progress).toEqual(mockProgress);
      expect(result.id).toBe(mockCourseId);
    });

    it('療程不存在應拋出 NotFoundException', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCourseWithProgress(mockCourseId, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

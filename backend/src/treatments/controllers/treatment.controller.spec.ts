import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TreatmentCourseController, StaffSessionController } from './treatment-course.controller';
import { TreatmentCourseService } from '../services/treatment-course.service';
import { TreatmentSessionService } from '../services/treatment-session.service';
import { TreatmentCourseTemplateService } from '../services/treatment-course-template.service';
import { CreateTreatmentCourseDto } from '../dto/create-treatment-course.dto';
import { UpdateTreatmentSessionDto } from '../dto/update-treatment-session.dto';
import Decimal from 'decimal.js';

describe('TreatmentCourseController', () => {
  let controller: TreatmentCourseController;
  let courseService: TreatmentCourseService;
  let sessionService: TreatmentSessionService;
  let templateService: TreatmentCourseTemplateService;

  // 模擬數據
  const mockCourseId = 'course-123';
  const mockSessionId = 'session-123';
  const mockTemplateId = 'template-123';
  const mockPatientId = 'patient-123';
  const mockStaffId = 'staff-123';
  const mockClinicId = 'clinic-123';

  const mockCourse = {
    id: mockCourseId,
    patientId: mockPatientId,
    templateId: mockTemplateId,
    clinicId: mockClinicId,
    status: 'active',
    purchaseDate: new Date(),
    purchaseAmount: new Decimal('5000'),
    pointsRedeemed: new Decimal('0'),
    actualPayment: new Decimal('5000'),
    sessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTemplate = {
    id: mockTemplateId,
    clinicId: mockClinicId,
    name: '美容療程套餐',
    totalPrice: new Decimal('5000'),
    totalSessions: 10,
    isActive: true,
    stageConfig: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession = {
    id: mockSessionId,
    treatmentCourseId: mockCourseId,
    clinicId: mockClinicId,
    sessionNumber: 1,
    completionStatus: 'pending',
    scheduledDate: new Date(),
    actualStartTime: null,
    actualEndTime: null,
    therapistNotes: '',
    patientFeedback: '',
    staffAssignments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCompletedSession = {
    ...mockSession,
    completionStatus: 'completed',
    actualStartTime: new Date(),
    actualEndTime: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TreatmentCourseController],
      providers: [
        {
          provide: TreatmentCourseService,
          useValue: {
            createCourse: jest.fn(),
            getCourseById: jest.fn(),
          },
        },
        {
          provide: TreatmentSessionService,
          useValue: {
            completeSession: jest.fn(),
            getStaffSessions: jest.fn(),
          },
        },
        {
          provide: TreatmentCourseTemplateService,
          useValue: {
            getActiveTemplates: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TreatmentCourseController>(TreatmentCourseController);
    courseService = module.get<TreatmentCourseService>(TreatmentCourseService);
    sessionService = module.get<TreatmentSessionService>(TreatmentSessionService);
    templateService = module.get<TreatmentCourseTemplateService>(
      TreatmentCourseTemplateService,
    );
  });

  describe('POST /treatments/courses - createCourse', () => {
    it('should create a course successfully', async () => {
      const createDto: CreateTreatmentCourseDto = {
        patientId: mockPatientId,
        templateId: mockTemplateId,
        clinicId: mockClinicId,
        pointsToRedeem: 0,
      };

      jest.spyOn(courseService, 'createCourse').mockResolvedValue(mockCourse);

      const result = await controller.createCourse(createDto);

      expect(result).toEqual(mockCourse);
      expect(courseService.createCourse).toHaveBeenCalledWith(createDto);
    });

    it('should fail when patientId is missing', async () => {
      const createDto: CreateTreatmentCourseDto = {
        patientId: '',
        templateId: mockTemplateId,
        clinicId: mockClinicId,
      };

      jest
        .spyOn(courseService, 'createCourse')
        .mockRejectedValue(new BadRequestException('patientId 不能為空'));

      await expect(controller.createCourse(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should fail when templateId is invalid', async () => {
      const createDto: CreateTreatmentCourseDto = {
        patientId: mockPatientId,
        templateId: 'invalid-id',
        clinicId: mockClinicId,
      };

      jest
        .spyOn(courseService, 'createCourse')
        .mockRejectedValue(new NotFoundException('課程模板不存在'));

      await expect(controller.createCourse(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('GET /treatments/courses/:courseId - getCourseById', () => {
    it('should retrieve a course by ID successfully', async () => {
      jest.spyOn(courseService, 'getCourseById').mockResolvedValue(mockCourse);

      const result = await controller.getCourseById(mockCourseId, mockClinicId);

      expect(result).toEqual(mockCourse);
      expect(courseService.getCourseById).toHaveBeenCalledWith(
        mockCourseId,
        mockClinicId,
      );
    });

    it('should fail when courseId is not found', async () => {
      jest
        .spyOn(courseService, 'getCourseById')
        .mockRejectedValue(new NotFoundException('療程不存在'));

      await expect(
        controller.getCourseById('non-existent', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fail when clinicId mismatches', async () => {
      jest
        .spyOn(courseService, 'getCourseById')
        .mockRejectedValue(new NotFoundException('療程不存在'));

      await expect(
        controller.getCourseById(mockCourseId, 'wrong-clinic'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /treatments/templates - getActiveTemplates', () => {
    it('should retrieve active templates successfully', async () => {
      const templates = [mockTemplate];

      jest
        .spyOn(templateService, 'getActiveTemplates')
        .mockResolvedValue(templates);

      const result = await controller.getActiveTemplates(mockClinicId);

      expect(result).toEqual(templates);
      expect(templateService.getActiveTemplates).toHaveBeenCalledWith(
        mockClinicId,
      );
    });

    it('should fail when clinicId is missing', async () => {
      jest
        .spyOn(templateService, 'getActiveTemplates')
        .mockRejectedValue(
          new BadRequestException('clinicId 不能為空'),
        );

      await expect(controller.getActiveTemplates('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return empty array when no templates found', async () => {
      jest.spyOn(templateService, 'getActiveTemplates').mockResolvedValue([]);

      const result = await controller.getActiveTemplates(mockClinicId);

      expect(result).toEqual([]);
    });
  });

  describe('PUT /treatments/sessions/:sessionId - completeSession', () => {
    it('should complete a session successfully', async () => {
      const updateDto: UpdateTreatmentSessionDto = {
        actualStartTime: new Date(),
        actualEndTime: new Date(),
        completionStatus: 'completed',
        therapistNotes: '治療順利完成',
        patientFeedback: '效果不錯',
      };

      jest
        .spyOn(sessionService, 'completeSession')
        .mockResolvedValue(mockCompletedSession);

      const result = await controller.completeSession(
        mockSessionId,
        updateDto,
        mockClinicId,
      );

      expect(result).toEqual(mockCompletedSession);
      expect(sessionService.completeSession).toHaveBeenCalledWith(
        mockSessionId,
        updateDto,
        mockClinicId,
      );
    });

    it('should complete session with staff assignments', async () => {
      const updateDto: UpdateTreatmentSessionDto = {
        actualStartTime: new Date(),
        actualEndTime: new Date(),
        completionStatus: 'completed',
        staffAssignments: [
          {
            staffId: mockStaffId,
            role: 'therapist',
            ppfPercentage: 50,
          },
        ],
      };

      const sessionWithAssignments = {
        ...mockCompletedSession,
        staffAssignments: updateDto.staffAssignments,
      };

      jest
        .spyOn(sessionService, 'completeSession')
        .mockResolvedValue(sessionWithAssignments);

      const result = await controller.completeSession(
        mockSessionId,
        updateDto,
        mockClinicId,
      );

      expect(result.staffAssignments).toBeDefined();
      expect(sessionService.completeSession).toHaveBeenCalledWith(
        mockSessionId,
        updateDto,
        mockClinicId,
      );
    });

    it('should fail when session is not found', async () => {
      const updateDto: UpdateTreatmentSessionDto = {
        completionStatus: 'completed',
      };

      jest
        .spyOn(sessionService, 'completeSession')
        .mockRejectedValue(new NotFoundException('療程次數不存在'));

      await expect(
        controller.completeSession('non-existent', updateDto, mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fail when session is already completed', async () => {
      const updateDto: UpdateTreatmentSessionDto = {
        completionStatus: 'completed',
      };

      jest
        .spyOn(sessionService, 'completeSession')
        .mockRejectedValue(
          new BadRequestException('療程次數已完成，無法再次完成'),
        );

      await expect(
        controller.completeSession(mockSessionId, updateDto, mockClinicId),
      ).rejects.toThrow(BadRequestException);
    });
  });


  describe('Integration Tests', () => {
    it('should handle multiple course operations in sequence', async () => {
      // Create course
      const createDto: CreateTreatmentCourseDto = {
        patientId: mockPatientId,
        templateId: mockTemplateId,
        clinicId: mockClinicId,
      };

      jest.spyOn(courseService, 'createCourse').mockResolvedValue(mockCourse);
      const createdCourse = await controller.createCourse(createDto);
      expect(createdCourse).toEqual(mockCourse);

      // Retrieve course
      jest.spyOn(courseService, 'getCourseById').mockResolvedValue(mockCourse);
      const retrievedCourse = await controller.getCourseById(
        mockCourseId,
        mockClinicId,
      );
      expect(retrievedCourse).toEqual(mockCourse);
    });

    it('should retrieve templates and create course in sequence', async () => {
      // Get templates
      jest
        .spyOn(templateService, 'getActiveTemplates')
        .mockResolvedValue([mockTemplate]);
      const templates = await controller.getActiveTemplates(mockClinicId);
      expect(templates).toHaveLength(1);

      // Create course using selected template
      const createDto: CreateTreatmentCourseDto = {
        patientId: mockPatientId,
        templateId: templates[0].id,
        clinicId: mockClinicId,
      };

      jest.spyOn(courseService, 'createCourse').mockResolvedValue(mockCourse);
      const course = await controller.createCourse(createDto);
      expect(course.templateId).toEqual(mockTemplateId);
    });
  });
});

describe('StaffSessionController', () => {
  let controller: StaffSessionController;
  let sessionService: TreatmentSessionService;

  const mockCourseId = 'course-123';
  const mockSessionId = 'session-123';
  const mockTemplateId = 'template-123';
  const mockPatientId = 'patient-123';
  const mockStaffId = 'staff-123';
  const mockClinicId = 'clinic-123';

  const mockSession = {
    id: mockSessionId,
    treatmentCourseId: mockCourseId,
    clinicId: mockClinicId,
    sessionNumber: 1,
    completionStatus: 'pending',
    scheduledDate: new Date(),
    actualStartTime: null,
    actualEndTime: null,
    therapistNotes: '',
    patientFeedback: '',
    staffAssignments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCompletedSession = {
    ...mockSession,
    completionStatus: 'completed',
    actualStartTime: new Date(),
    actualEndTime: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffSessionController],
      providers: [
        {
          provide: TreatmentSessionService,
          useValue: {
            getStaffSessions: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StaffSessionController>(StaffSessionController);
    sessionService = module.get<TreatmentSessionService>(TreatmentSessionService);
  });

  describe('GET /staff/:staffId/sessions - getStaffSessions', () => {
    it('should retrieve all staff sessions successfully', async () => {
      const sessions = [mockSession, mockCompletedSession];

      jest
        .spyOn(sessionService, 'getStaffSessions')
        .mockResolvedValue(sessions);

      const result = await controller.getStaffSessions(
        mockStaffId,
        mockClinicId,
      );

      expect(result).toEqual(sessions);
      expect(sessionService.getStaffSessions).toHaveBeenCalledWith(
        mockStaffId,
        mockClinicId,
        undefined,
      );
    });

    it('should retrieve staff sessions filtered by status', async () => {
      const sessions = [mockCompletedSession];

      jest
        .spyOn(sessionService, 'getStaffSessions')
        .mockResolvedValue(sessions);

      const result = await controller.getStaffSessions(
        mockStaffId,
        mockClinicId,
        'completed',
      );

      expect(result).toEqual(sessions);
      expect(sessionService.getStaffSessions).toHaveBeenCalledWith(
        mockStaffId,
        mockClinicId,
        expect.objectContaining({ status: 'completed' }),
      );
    });

    it('should retrieve staff sessions filtered by date range', async () => {
      const startDate = '2026-01-01';
      const endDate = '2026-02-13';
      const sessions = [mockSession];

      jest
        .spyOn(sessionService, 'getStaffSessions')
        .mockResolvedValue(sessions);

      const result = await controller.getStaffSessions(
        mockStaffId,
        mockClinicId,
        undefined,
        startDate,
        endDate,
      );

      expect(result).toEqual(sessions);
      expect(sessionService.getStaffSessions).toHaveBeenCalledWith(
        mockStaffId,
        mockClinicId,
        expect.objectContaining({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }),
      );
    });

    it('should fail when clinicId is missing', async () => {
      jest
        .spyOn(sessionService, 'getStaffSessions')
        .mockRejectedValue(
          new BadRequestException('clinicId 不能為空'),
        );

      await expect(
        controller.getStaffSessions(mockStaffId, ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return empty array when no sessions found', async () => {
      jest.spyOn(sessionService, 'getStaffSessions').mockResolvedValue([]);

      const result = await controller.getStaffSessions(
        mockStaffId,
        mockClinicId,
      );

      expect(result).toEqual([]);
    });
  });
});

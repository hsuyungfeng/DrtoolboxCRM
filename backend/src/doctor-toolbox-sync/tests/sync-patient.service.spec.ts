import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncPatientService } from '../services/sync-patient.service';
import { SyncIndexService } from '../services/sync-index.service';
import { RetryService } from '../services/retry.service';
import { PatientService } from '../../patients/services/patient.service';
import { Patient } from '../../patients/entities/patient.entity';
import { SyncPatientIndex } from '../entities/sync-patient-index.entity';
import { WebhookPayloadDto, ToolboxPatientDto } from '../dto/webhook-payload.dto';
import { SyncStatus } from '../../common/enums/sync-status.enum';

describe('SyncPatientService', () => {
  let service: SyncPatientService;
  let patientRepository: any;
  let syncIndexRepository: any;
  let patientService: any;
  let syncIndexService: any;
  let retryService: any;
  let configService: any;

  beforeEach(async () => {
    // Mock repositories
    patientRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    syncIndexRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };

    // Mock services
    patientService = {
      createPatient: jest.fn(),
      updatePatient: jest.fn(),
    };

    syncIndexService = {
      upsertIndex: jest.fn(),
      findByCrmPatientId: jest.fn(),
      findByWebhookId: jest.fn(),
      findByIdNumberAndName: jest.fn(),
      updateStatus: jest.fn(),
      getFailedSyncs: jest.fn(),
      deleteIndex: jest.fn(),
    };

    retryService = {
      executeWithRetry: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncPatientService,
        {
          provide: getRepositoryToken(Patient),
          useValue: patientRepository,
        },
        {
          provide: getRepositoryToken(SyncPatientIndex),
          useValue: syncIndexRepository,
        },
        {
          provide: PatientService,
          useValue: patientService,
        },
        {
          provide: SyncIndexService,
          useValue: syncIndexService,
        },
        {
          provide: RetryService,
          useValue: retryService,
        },
      ],
    }).compile();

    service = module.get<SyncPatientService>(SyncPatientService);
  });

  it('應該被定義', () => {
    expect(service).toBeDefined();
  });

  describe('syncFromToolbox', () => {
    const clinicId = 'clinic-123';
    const toolboxPatient: ToolboxPatientDto = {
      id: 'TB-001',
      name: 'John Doe',
      idNumber: '123456789',
      phone: '0912345678',
      email: 'john@example.com',
    };

    const payload: WebhookPayloadDto = {
      webhookId: 'webhook-123',
      patientId: 'TB-001',
      action: 'patient_created' as any,
      timestamp: Math.floor(Date.now() / 1000),
      patient: toolboxPatient,
    };

    /**
     * 測試場景 1：新患者建立
     * Toolbox 傳來新患者資料，精確匹配和備用匹配都無結果 → 建立新 CRM 患者
     */
    it('應在新患者時建立新 CRM 患者', async () => {
      const createdPatient: Patient = {
        id: 'patient-uuid-1',
        clinicId,
        idNumber: toolboxPatient.idNumber,
        name: toolboxPatient.name,
        phoneNumber: toolboxPatient.phone,
        email: toolboxPatient.email,
      } as Patient;

      patientRepository.findOne.mockResolvedValue(null); // 精確和備用都找不到
      patientService.createPatient.mockResolvedValue(createdPatient);

      const result = await service.syncFromToolbox(payload, clinicId);

      expect(result).toEqual(createdPatient);
      expect(patientService.createPatient).toHaveBeenCalledWith(
        {
          name: toolboxPatient.name,
          idNumber: toolboxPatient.idNumber,
          email: toolboxPatient.email,
          phone: toolboxPatient.phone,
        },
        clinicId,
      );
    });

    /**
     * 測試場景 2：精確匹配更新
     * 精確查詢找到患者 → 應用 Toolbox 資料更新（若欄位有差異）
     */
    it('應在精確匹配時更新現有患者', async () => {
      const existingPatient: Patient = {
        id: 'patient-uuid-1',
        clinicId,
        idNumber: toolboxPatient.idNumber,
        name: toolboxPatient.name,
        phoneNumber: '0987654321', // 舊電話
        email: null, // 舊郵箱為空
      } as Patient;

      const updatedPatient = { ...existingPatient };

      patientRepository.findOne
        .mockResolvedValueOnce(existingPatient) // 精確匹配找到
        .mockResolvedValueOnce(updatedPatient); // save 返回更新後的患者

      const result = await service.syncFromToolbox(payload, clinicId);

      expect(result).toBeDefined();
      expect(patientService.createPatient).not.toHaveBeenCalled();
    });

    /**
     * 測試場景 3：衝突場景 - 備用匹配找到，進行衝突檢測和合併
     * 備用匹配找到患者，但身份證號不同 → 衝突 → 合併（保留 CRM 身份證號）
     */
    it('應在衝突場景時進行合併（保留 CRM 身份證號）', async () => {
      const existingPatient: Patient = {
        id: 'patient-uuid-2',
        clinicId,
        idNumber: '999999999', // 不同的身份證號
        name: toolboxPatient.name,
        phoneNumber: toolboxPatient.phone,
        email: null,
      } as Patient;

      const mergedPatient = { ...existingPatient };
      mergedPatient.email = toolboxPatient.email; // 更新郵箱

      patientRepository.findOne
        .mockResolvedValueOnce(null) // 精確匹配失敗
        .mockResolvedValueOnce(existingPatient) // 備用匹配成功
        .mockResolvedValueOnce(mergedPatient); // save 返回合併後的患者

      const result = await service.syncFromToolbox(payload, clinicId);

      expect(result).toBeDefined();
      // 驗證身份證號未被覆蓋
      expect(result.idNumber).toBe('999999999');
    });
  });

  describe('detectConflict', () => {
    /**
     * 測試場景：衝突識別
     */
    it('應在身份證號不同時檢測到衝突', async () => {
      const crmPatient: Patient = {
        idNumber: '111111111',
      } as Patient;

      const toolboxData: ToolboxPatientDto = {
        idNumber: '222222222',
      } as ToolboxPatientDto;

      const hasConflict = await service.detectConflict(
        crmPatient,
        toolboxData,
      );

      expect(hasConflict).toBe(true);
    });

    it('應在身份證號相同時不檢測衝突', async () => {
      const crmPatient: Patient = {
        idNumber: '111111111',
      } as Patient;

      const toolboxData: ToolboxPatientDto = {
        idNumber: '111111111',
      } as ToolboxPatientDto;

      const hasConflict = await service.detectConflict(
        crmPatient,
        toolboxData,
      );

      expect(hasConflict).toBe(false);
    });

    it('應在 Toolbox 身份證號為空時不檢測衝突', async () => {
      const crmPatient: Patient = {
        idNumber: '111111111',
      } as Patient;

      const toolboxData: ToolboxPatientDto = {
        idNumber: '', // 空
      } as ToolboxPatientDto;

      const hasConflict = await service.detectConflict(
        crmPatient,
        toolboxData,
      );

      expect(hasConflict).toBe(false);
    });
  });

  describe('mergePatients', () => {
    /**
     * 測試場景：合併策略
     */
    it('應保留 CRM 身份證號並從 Toolbox 補充 phone/email', async () => {
      const crmPatient: Patient = {
        id: 'patient-1',
        idNumber: '111111111', // CRM 身份證號優先
        phoneNumber: '0912345678', // CRM 已有電話
        email: null, // CRM 郵箱為空
      } as Patient;

      const toolboxData: ToolboxPatientDto = {
        idNumber: '222222222', // Toolbox 身份證號被忽略
        phone: '0987654321', // Toolbox 電話
        email: 'john@example.com', // Toolbox 郵箱
      } as ToolboxPatientDto;

      patientRepository.save.mockResolvedValue({
        ...crmPatient,
        email: 'john@example.com', // 只更新郵箱
      });

      const result = await service.mergePatients(crmPatient, toolboxData);

      // 驗證身份證號未被改變
      expect(result.idNumber).toBe('111111111');
      // 驗證郵箱被更新
      expect(result.email).toBe('john@example.com');
    });

    it('應在 CRM 和 Toolbox 都有 phone/email 時不覆蓋', async () => {
      const crmPatient: Patient = {
        id: 'patient-2',
        idNumber: '111111111',
        phoneNumber: '0912345678', // CRM 電話
        email: 'crm@example.com', // CRM 郵箱
      } as Patient;

      const toolboxData: ToolboxPatientDto = {
        phone: '0987654321', // Toolbox 電話
        email: 'toolbox@example.com', // Toolbox 郵箱
      } as ToolboxPatientDto;

      patientRepository.save.mockResolvedValue(crmPatient); // 無更新

      const result = await service.mergePatients(crmPatient, toolboxData);

      // 驗證 CRM 值未被改變
      expect(result.phoneNumber).toBe('0912345678');
      expect(result.email).toBe('crm@example.com');
    });
  });

  describe('pushPatientToToolbox', () => {
    const clinicId = 'clinic-123';
    const patient: Patient = {
      id: 'patient-123',
      name: 'John Doe',
      idNumber: '123456789',
      phoneNumber: '0912345678',
      email: 'john@example.com',
    } as Patient;

    /**
     * 測試場景：成功推送
     */
    it('應成功推送患者到 Toolbox 並更新同步狀態', async () => {
      const webhookUrl = 'https://toolbox.example.com/webhook';

      // 設定環境變數
      const originalUrl = process.env.DOCTOR_TOOLBOX_WEBHOOK_URL;
      process.env.DOCTOR_TOOLBOX_WEBHOOK_URL = webhookUrl;

      const mockResponse = { ok: true, status: 200, statusText: 'OK' };
      retryService.executeWithRetry.mockResolvedValue(mockResponse);

      try {
        await service.pushPatientToToolbox(patient, clinicId);

        expect(retryService.executeWithRetry).toHaveBeenCalled();
        expect(syncIndexService.updateStatus).toHaveBeenCalledWith(
          patient.id,
          SyncStatus.SYNCED,
          null,
        );
      } finally {
        // 還原環境變數
        if (originalUrl !== undefined) {
          process.env.DOCTOR_TOOLBOX_WEBHOOK_URL = originalUrl;
        } else {
          delete process.env.DOCTOR_TOOLBOX_WEBHOOK_URL;
        }
      }
    });

    /**
     * 測試場景：重試失敗
     */
    it('應在重試全失敗時更新同步狀態為 failed', async () => {
      const webhookUrl = 'https://toolbox.example.com/webhook';
      const originalUrl = process.env.DOCTOR_TOOLBOX_WEBHOOK_URL;
      process.env.DOCTOR_TOOLBOX_WEBHOOK_URL = webhookUrl;

      const testError = new Error('Network timeout');
      retryService.executeWithRetry.mockRejectedValue(testError);

      try {
        await service.pushPatientToToolbox(patient, clinicId);

        expect(syncIndexService.updateStatus).toHaveBeenCalledWith(
          patient.id,
          SyncStatus.FAILED,
          expect.stringContaining('Network timeout'),
        );
      } finally {
        if (originalUrl !== undefined) {
          process.env.DOCTOR_TOOLBOX_WEBHOOK_URL = originalUrl;
        } else {
          delete process.env.DOCTOR_TOOLBOX_WEBHOOK_URL;
        }
      }
    });

    /**
     * 測試場景：未配置 webhook URL
     */
    it('應在未配置 webhook URL 時跳過推送', async () => {
      const originalUrl = process.env.DOCTOR_TOOLBOX_WEBHOOK_URL;
      delete process.env.DOCTOR_TOOLBOX_WEBHOOK_URL;

      try {
        await service.pushPatientToToolbox(patient, clinicId);

        expect(retryService.executeWithRetry).not.toHaveBeenCalled();
        expect(syncIndexService.updateStatus).not.toHaveBeenCalled();
      } finally {
        if (originalUrl !== undefined) {
          process.env.DOCTOR_TOOLBOX_WEBHOOK_URL = originalUrl;
        }
      }
    });
  });

  describe('findPatientExact', () => {
    it('應根據 clinicId + idNumber + name 精確查詢患者', async () => {
      const clinicId = 'clinic-123';
      const idNumber = '123456789';
      const name = 'John Doe';

      const expectedPatient: Patient = {
        id: 'patient-1',
        clinicId,
        idNumber,
        name,
      } as Patient;

      patientRepository.findOne.mockResolvedValue(expectedPatient);

      const result = await service.findPatientExact(
        clinicId,
        idNumber,
        name,
      );

      expect(patientRepository.findOne).toHaveBeenCalledWith({
        where: { clinicId, idNumber, name },
      });
      expect(result).toEqual(expectedPatient);
    });
  });

  describe('findPatientFallback', () => {
    it('應根據 clinicId + name + phone 備用查詢患者', async () => {
      const clinicId = 'clinic-123';
      const name = 'John Doe';
      const phone = '0912345678';

      const expectedPatient: Patient = {
        id: 'patient-1',
        clinicId,
        name,
        phoneNumber: phone,
      } as Patient;

      patientRepository.findOne.mockResolvedValue(expectedPatient);

      const result = await service.findPatientFallback(
        clinicId,
        name,
        phone,
      );

      expect(patientRepository.findOne).toHaveBeenCalledWith({
        where: { clinicId, name, phoneNumber: phone },
      });
      expect(result).toEqual(expectedPatient);
    });
  });
});

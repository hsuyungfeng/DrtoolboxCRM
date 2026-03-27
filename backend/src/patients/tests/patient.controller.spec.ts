/**
 * PatientController 集成測試
 * 使用 supertest 測試 HTTP 端點行為
 * Integration tests for PatientController endpoints using supertest
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
import { PatientController } from '../controllers/patient.controller';
import { PatientService } from '../services/patient.service';
import { PatientSearchService } from '../services/patient-search.service';
import { ClinicContextGuard } from '../../common/guards/clinic-context.guard';

/**
 * 測試用 Guard：模擬已認證用戶，設定 clinicId 到 req
 */
class MockClinicContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.clinicId = 'clinic-001';
    request.user = { id: 'user-001', clinicId: 'clinic-001' };
    return true;
  }
}

describe('PatientController（集成測試）', () => {
  let app: INestApplication;
  let patientService: jest.Mocked<PatientService>;
  let patientSearchService: jest.Mocked<PatientSearchService>;

  const mockClinicId = 'clinic-001';

  const mockPatient = {
    id: 'patient-001',
    clinicId: mockClinicId,
    name: '王小明',
    idNumber: 'A123456789',
    phoneNumber: '0912345678',
    email: 'wang@example.com',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PatientController],
      providers: [
        {
          provide: PatientService,
          useValue: {
            createPatient: jest.fn(),
            updatePatient: jest.fn(),
          },
        },
        {
          provide: PatientSearchService,
          useValue: {
            searchPatients: jest.fn(),
            identifyPatientByIdAndName: jest.fn(),
            getPatientProfile: jest.fn(),
            getClinicPatients: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ClinicContextGuard)
      .useClass(MockClinicContextGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    patientService = moduleFixture.get<PatientService>(PatientService) as jest.Mocked<PatientService>;
    patientSearchService = moduleFixture.get<PatientSearchService>(PatientSearchService) as jest.Mocked<PatientSearchService>;
  });

  afterEach(async () => {
    await app.close();
  });

  // ────────────────────────────────────────────────────────────────────
  // GET /api/patients/search
  // ────────────────────────────────────────────────────────────────────
  describe('GET /api/patients/search', () => {
    it('應該回傳搜尋結果（200）', async () => {
      patientSearchService.searchPatients.mockResolvedValue([mockPatient] as any);

      const response = await request(app.getHttpServer())
        .get('/api/patients/search')
        .query({ keyword: '王', limit: 10 })
        .expect(200);

      expect(response.body.statusCode).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(1);
      expect(patientSearchService.searchPatients).toHaveBeenCalledWith('王', mockClinicId, 10);
    });

    it('無關鍵字時仍應回傳結果（200）', async () => {
      patientSearchService.searchPatients.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/patients/search')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    it('應使用預設 limit 20', async () => {
      patientSearchService.searchPatients.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/patients/search')
        .query({ keyword: '測試' })
        .expect(200);

      expect(patientSearchService.searchPatients).toHaveBeenCalledWith('測試', mockClinicId, 20);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // GET /api/patients/identify
  // ────────────────────────────────────────────────────────────────────
  describe('GET /api/patients/identify', () => {
    it('應該回傳身份驗證結果（200）', async () => {
      patientSearchService.identifyPatientByIdAndName.mockResolvedValue(mockPatient as any);

      const response = await request(app.getHttpServer())
        .get('/api/patients/identify')
        .query({ idNumber: 'A123456789', name: '王小明' })
        .expect(200);

      expect(response.body.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // GET /api/patients/:id
  // ────────────────────────────────────────────────────────────────────
  describe('GET /api/patients/:id', () => {
    it('應該回傳患者詳情（200）', async () => {
      patientSearchService.getPatientProfile.mockResolvedValue(mockPatient as any);

      const response = await request(app.getHttpServer())
        .get('/api/patients/patient-001')
        .expect(200);

      expect(response.body.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(patientSearchService.getPatientProfile).toHaveBeenCalledWith('patient-001', mockClinicId);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // POST /api/patients
  // ────────────────────────────────────────────────────────────────────
  describe('POST /api/patients', () => {
    it('應該建立患者並回傳 201', async () => {
      const createDto = {
        idNumber: 'B234567890',
        name: '李小華',
        phoneNumber: '0987654321',
        email: 'li@example.com',
      };

      patientService.createPatient.mockResolvedValue({ ...mockPatient, ...createDto } as any);

      const response = await request(app.getHttpServer())
        .post('/api/patients')
        .send(createDto)
        .expect(201);

      expect(response.body.statusCode).toBe(201);
      expect(response.body.message).toBe('患者已建立');
      expect(response.body.data).toBeDefined();
    });

    it('應傳遞 clinicId 給 PatientService', async () => {
      const createDto = {
        idNumber: 'C345678901',
        name: '陳小美',
        phoneNumber: '0912000001',
      };

      patientService.createPatient.mockResolvedValue({ ...mockPatient, ...createDto } as any);

      await request(app.getHttpServer())
        .post('/api/patients')
        .send(createDto)
        .expect(201);

      expect(patientService.createPatient).toHaveBeenCalledWith(
        expect.objectContaining({ idNumber: 'C345678901' }),
        mockClinicId,
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // PATCH /api/patients/:id
  // ────────────────────────────────────────────────────────────────────
  describe('PATCH /api/patients/:id', () => {
    it('應該更新患者資料並回傳 200', async () => {
      const updateDto = { name: '王大明', phoneNumber: '0912111111' };
      const updatedPatient = { ...mockPatient, ...updateDto };

      patientService.updatePatient.mockResolvedValue(updatedPatient as any);

      const response = await request(app.getHttpServer())
        .patch('/api/patients/patient-001')
        .send(updateDto)
        .expect(200);

      expect(response.body.statusCode).toBe(200);
      expect(response.body.message).toBe('患者資料已更新');
      expect(response.body.data).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // GET /api/patients
  // ────────────────────────────────────────────────────────────────────
  describe('GET /api/patients', () => {
    it('應該回傳分頁患者列表（200）', async () => {
      patientSearchService.getClinicPatients.mockResolvedValue({
        data: [mockPatient],
        page: 1,
        pageSize: 20,
        total: 1,
      } as any);

      const response = await request(app.getHttpServer())
        .get('/api/patients')
        .query({ page: 1, pageSize: 20 })
        .expect(200);

      expect(response.body.statusCode).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.total).toBe(1);
    });
  });
});

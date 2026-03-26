---
phase: 01-treatment-prescription-core
plan: 11
type: execute
wave: 4
depends_on: [01, 02, 03, 04, 05, 06, 07, 08, 09, 10]
files_modified:
  - backend/src/treatments/tests/medical-order.service.spec.ts
  - backend/src/treatments/tests/treatment-course.service.spec.ts
  - backend/src/patients/tests/patient-search.service.spec.ts
  - backend/src/patients/tests/patient.controller.spec.ts
autonomous: true
requirements: [COURSE-01, COURSE-02, COURSE-03, COURSE-04, COURSE-05, SCRIPT-01, SCRIPT-02, SCRIPT-03, PATIENT-01, PATIENT-02, PATIENT-03]
must_haves:
  truths:
    - 所有 CRUD 操作都有單元測試
    - 服務層邏輯都有測試覆蓋
    - 端點都有集成測試
    - 達到 90% 代碼覆蓋率
  artifacts:
    - path: backend/src/treatments/tests/medical-order.service.spec.ts
      provides: 醫令服務測試
      contains: "describe"
    - path: backend/src/treatments/tests/treatment-course.service.spec.ts
      provides: 療程服務測試
      contains: "describe"

---

<objective>
建立後端單元和集成測試，達到 90% 代碼覆蓋率，確保所有功能正確。

**Purpose:**
確保系統質量，防止回歸。

**Output:**
測試套件、Jest 配置、覆蓋報告。
</objective>

<execution_context>
@.planning/codebase/STACK.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 測試框架

- Jest 30.0.0：測試框架
- @nestjs/testing 11.0.1：NestJS 測試工具
- supertest 7.0.0：HTTP 端點測試

## 測試覆蓋目標

- Service 層：100%（關鍵業務邏輯）
- Controller 層：90%（端點驗證）
- 整體目標：90% 代碼覆蓋率

## 測試方針

- 單元測試：Service 方法的業務邏輯
- 集成測試：Controller 端點的 HTTP 請求/響應
- Mock：Repository 層，不使用真實數據庫
</context>

<tasks>

<task type="auto">
  <name>任務 1：建立 MedicalOrderService 和 TreatmentCourseService 單元測試</name>
  <files>
    - backend/src/treatments/tests/medical-order.service.spec.ts
    - backend/src/treatments/tests/treatment-course.service.spec.ts
  </files>

  <read_first>
    - backend/src/treatments/services/medical-order.service.ts
    - backend/src/treatments/services/treatment-course.service.ts
  </read_first>

  <action>
建立 NestJS 單元測試：

**medical-order.service.spec.ts**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MedicalOrderService } from '../services/medical-order.service';
import { MedicalOrder } from '../entities/medical-order.entity';
import { ScriptTemplate } from '../entities/script-template.entity';
import { Patient } from '@/patients/entities/patient.entity';
import { CreateMedicalOrderDto } from '../dto/create-medical-order.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MedicalOrderService', () => {
  let service: MedicalOrderService;
  let mockMedicalOrderRepo, mockScriptTemplateRepo, mockPatientRepo;

  beforeEach(async () => {
    mockMedicalOrderRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockScriptTemplateRepo = {
      findOne: jest.fn(),
    };

    mockPatientRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalOrderService,
        {
          provide: getRepositoryToken(MedicalOrder),
          useValue: mockMedicalOrderRepo,
        },
        {
          provide: getRepositoryToken(ScriptTemplate),
          useValue: mockScriptTemplateRepo,
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepo,
        },
      ],
    }).compile();

    service = module.get<MedicalOrderService>(MedicalOrderService);
  });

  describe('createMedicalOrder', () => {
    it('應該成功建立醫令', async () => {
      const dto: CreateMedicalOrderDto = {
        patientId: 'patient-1',
        藥物或治療名稱: '感冒藥',
        劑量: '500mg',
        使用方式: '口服',
        療程數: 5,
      };

      const mockPatient = { id: 'patient-1', name: 'John' };
      const mockOrder = { id: 'order-1', ...dto };

      mockPatientRepo.findOne.mockResolvedValue(mockPatient);
      mockMedicalOrderRepo.create.mockReturnValue(mockOrder);
      mockMedicalOrderRepo.save.mockResolvedValue(mockOrder);

      const result = await service.createMedicalOrder(
        dto,
        'doctor-1',
        'clinic-1'
      );

      expect(result).toEqual(mockOrder);
      expect(mockPatientRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'patient-1', clinicId: 'clinic-1' },
      });
    });

    it('患者不存在時應拋出 NotFoundException', async () => {
      const dto: CreateMedicalOrderDto = {
        patientId: 'non-existent',
        藥物或治療名稱: '感冒藥',
        劑量: '500mg',
        使用方式: '口服',
        療程數: 5,
      };

      mockPatientRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createMedicalOrder(dto, 'doctor-1', 'clinic-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('療程數 <= 0 時應拋出 BadRequestException', async () => {
      const dto: CreateMedicalOrderDto = {
        patientId: 'patient-1',
        藥物或治療名稱: '感冒藥',
        劑量: '500mg',
        使用方式: '口服',
        療程數: 0,
      };

      mockPatientRepo.findOne.mockResolvedValue({ id: 'patient-1' });

      await expect(
        service.createMedicalOrder(dto, 'doctor-1', 'clinic-1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateMedicalOrder', () => {
    it('應該成功更新醫令狀態', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        開始日期: null,
      };

      mockMedicalOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockMedicalOrderRepo.save.mockResolvedValue({
        ...mockOrder,
        status: 'in_progress',
        開始日期: expect.any(Date),
      });

      const result = await service.updateMedicalOrder(
        'order-1',
        { status: 'in_progress' },
        'clinic-1'
      );

      expect(result.status).toBe('in_progress');
      expect(result.開始日期).toBeDefined();
    });

    it('無效狀態轉換應拋出異常', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'completed',
      };

      mockMedicalOrderRepo.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.updateMedicalOrder(
          'order-1',
          { status: 'pending' },
          'clinic-1'
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordMedicalOrderUsage', () => {
    it('應該記錄使用進度', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'pending',
        已使用數: 0,
        療程數: 5,
        開始日期: null,
      };

      mockMedicalOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockMedicalOrderRepo.save.mockResolvedValue({
        ...mockOrder,
        status: 'in_progress',
        已使用數: 2,
        開始日期: expect.any(Date),
      });

      const result = await service.recordMedicalOrderUsage(
        'order-1',
        'clinic-1',
        2
      );

      expect(result.已使用數).toBe(2);
      expect(result.status).toBe('in_progress');
    });

    it('全部使用時應自動轉換狀態為 completed', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'in_progress',
        已使用數: 4,
        療程數: 5,
      };

      mockMedicalOrderRepo.findOne.mockResolvedValue(mockOrder);
      mockMedicalOrderRepo.save.mockResolvedValue({
        ...mockOrder,
        已使用數: 5,
        status: 'completed',
        完成日期: expect.any(Date),
      });

      const result = await service.recordMedicalOrderUsage(
        'order-1',
        'clinic-1',
        1
      );

      expect(result.status).toBe('completed');
      expect(result.完成日期).toBeDefined();
    });
  });
});
```

**treatment-course.service.spec.ts** - 類似結構，測試療程業務邏輯

```typescript
describe('TreatmentCourseService', () => {
  // 類似 MedicalOrderService 的測試結構
  // 測試 createCourse（含事務）
  // 測試 completeSession（自動狀態轉換）
  // 測試 getProgressPercent（計算邏輯）
  // 測試 staffAssignment（分配驗證）
});
```

設計：
- Mock Repository 層，不使用真實數據庫
- 測試成功路徑和異常路徑
- 驗證自動狀態轉換邏輯
- 測試邊界條件（0、負數、超範圍）
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/treatments/tests/medical-order.service.spec.ts
    - [ ] 包含 describe：grep -q "describe(" backend/src/treatments/tests/medical-order.service.spec.ts
    - [ ] 包含 it：grep -q "it(" backend/src/treatments/tests/medical-order.service.spec.ts
    - [ ] Jest 執行無誤：npm test -- medical-order.service.spec.ts 2>&1 | head -20
  </verify>

  <done>
- MedicalOrderService 單元測試完成
- TreatmentCourseService 單元測試完成
- 包含邊界條件和異常路徑測試
  </done>
</task>

<task type="auto">
  <name>任務 2：建立控制器集成測試和覆蓋報告</name>
  <files>
    - backend/src/patients/tests/patient.controller.spec.ts
    - backend/jest.config.js（更新）
  </files>

  <read_first>
    - backend/src/patients/controllers/patient.controller.ts
    - backend/jest.config.js
  </read_first>

  <action>
建立控制器集成測試並配置覆蓋報告：

**patient.controller.spec.ts**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PatientController } from '../controllers/patient.controller';
import { PatientService } from '../services/patient.service';
import { PatientSearchService } from '../services/patient-search.service';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('PatientController (e2e)', () => {
  let app: INestApplication;
  let patientService: PatientService;

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
            searchPatients: jest.fn().mockResolvedValue([
              { id: '1', name: 'John', idNumber: 'ID001' },
            ]),
            identifyPatientByIdAndName: jest.fn(),
            getPatientProfile: jest.fn(),
            getClinicPatients: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    patientService = moduleFixture.get<PatientService>(PatientService);
  });

  it('/api/patients/search (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/patients/search')
      .query({ keyword: 'John' })
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveLength(1);
      });
  });

  it('/api/patients (POST) - 建立患者', () => {
    const createPatientDto = {
      idNumber: 'ID002',
      name: 'Jane',
      phoneNumber: '0912345678',
      email: 'jane@example.com',
    };

    return request(app.getHttpServer())
      .post('/api/patients')
      .send(createPatientDto)
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
  });
});
```

**jest.config.js** - 更新覆蓋配置

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.entity.ts',
    '!**/*.module.ts',
    '!**/dto/*.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

設計：
- 使用 supertest 進行 HTTP 集成測試
- 覆蓋所有主要端點
- 使用 coverageThreshold 強制 90% 目標
- 排除 entity、module、DTO（自動生成）
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/patients/tests/patient.controller.spec.ts
    - [ ] Jest 配置包含覆蓋閾值：grep -q "coverageThreshold" backend/jest.config.js
    - [ ] 執行測試：npm test 2>&1 | grep -i "coverage"
  </verify>

  <done>
- 控制器集成測試完成
- Jest 覆蓋配置已更新
- 90% 覆蓋目標已設置
  </done>
</task>

</tasks>

<verification>
**測試驗證：**
- npm test 執行所有測試
- 覆蓋報告生成成功
- 達到 90% 覆蓋率（目標）
- 所有測試通過

**代碼質量驗證：**
- 異常路徑都有測試
- 邊界條件都有測試
- 業務邏輯正確性確認
</verification>

<success_criteria>
- [ ] 服務層單元測試完成（>= 90% 覆蓋）
- [ ] 控制器集成測試完成
- [ ] Jest 配置覆蓋閾值設置
- [ ] 所有測試通過
- [ ] 覆蓋報告生成成功
</success_criteria>

<output>
完成後請建立：`.planning/phases/01-treatment-prescription-core/11-SUMMARY.md`

並執行以確認：
```bash
npm test -- --coverage
cat coverage/lcov-report/index.html  # 檢查覆蓋報告
```
</output>


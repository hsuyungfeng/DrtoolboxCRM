---
phase: 01-treatment-prescription-core
plan: 06
type: execute
wave: 2
depends_on: [03]
files_modified:
  - backend/src/patients/controllers/patient.controller.ts
  - backend/src/patients/services/patient.service.ts
autonomous: true
requirements: [PATIENT-01, PATIENT-02, PATIENT-03]
must_haves:
  truths:
    - 患者資料支持快速搜尋與篩選
    - 患者基本資料可完整查詢
    - 患者資料被正確隔離
  artifacts:
    - path: backend/src/patients/controllers/patient.controller.ts
      provides: 患者 API 端點
      contains: "@Get()" 和 "@Post()"
    - path: backend/src/patients/services/patient.service.ts
      provides: 患者業務邏輯
      contains: "searchPatients"

---

<objective>
實現患者 API 端點，支持搜尋、創建、編輯、查詢患者資訊。

**Purpose:**
醫護人員和患者都需要通過 API 與患者資料互動。支持快速搜尋、身份驗證。

**Output:**
PatientController（API 端點）、增強的 PatientService（業務邏輯）。
</objective>

<execution_context>
@/home/hsu/.claude/get-shit-done/workflows/execute-plan.md
@.planning/codebase/STACK.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 患者 API 端點

- GET /api/patients/search?keyword=xxx - 搜尋患者
- GET /api/patients/:id - 取得患者詳情
- POST /api/patients - 建立患者
- PATCH /api/patients/:id - 編輯患者
- GET /api/patients/:id/identify?idNumber=xxx&name=xxx - 雙重驗證患者

## 多租戶隔離

所有患者查詢都過濾 clinicId，確保診所資料隔離。
</context>

<tasks>

<task type="auto">
  <name>任務 1：建立 PatientController</name>
  <files>backend/src/patients/controllers/patient.controller.ts</files>

  <read_first>
    - backend/src/patients/services/patient-search.service.ts
    - backend/src/patients/services/patient.service.ts
  </read_first>

  <action>
建立 PatientController 包含以下端點：

```typescript
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClinicContextGuard } from '@/common/guards/clinic-context.guard';
import { PatientService } from '@/patients/services/patient.service';
import { PatientSearchService } from '@/patients/services/patient-search.service';
import { CreatePatientDto } from '@/patients/dto/create-patient.dto';
import { UpdatePatientDto } from '@/patients/dto/update-patient.dto';

@ApiBearerAuth()
@ApiTags('Patients')
@Controller('api/patients')
@UseGuards(ClinicContextGuard)
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly patientSearchService: PatientSearchService,
  ) {}

  /**
   * 搜尋患者
   * GET /api/patients/search?keyword=xxx
   */
  @Get('search')
  async search(
    @Query('keyword') keyword: string,
    @Query('limit') limit: number = 20,
    @Req() req: any,
  ) {
    const patients = await this.patientSearchService.searchPatients(
      keyword,
      req.clinicId,
      limit,
    );

    return {
      statusCode: 200,
      data: patients,
      count: patients.length,
    };
  }

  /**
   * 驗證患者身份（身份證ID + 姓名）
   * GET /api/patients/identify
   */
  @Get('identify')
  async identify(
    @Query('idNumber') idNumber: string,
    @Query('name') name: string,
    @Req() req: any,
  ) {
    const patient = await this.patientSearchService.identifyPatientByIdAndName(
      idNumber,
      name,
      req.clinicId,
    );

    return {
      statusCode: 200,
      data: patient,
    };
  }

  /**
   * 取得患者詳情
   * GET /api/patients/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const patient = await this.patientSearchService.getPatientProfile(
      id,
      req.clinicId,
    );

    return {
      statusCode: 200,
      data: patient,
    };
  }

  /**
   * 建立患者
   * POST /api/patients
   */
  @Post()
  async create(
    @Body() dto: CreatePatientDto,
    @Req() req: any,
  ) {
    const patient = await this.patientService.createPatient(
      dto,
      req.clinicId,
    );

    return {
      statusCode: 201,
      message: '患者已建立',
      data: patient,
    };
  }

  /**
   * 編輯患者
   * PATCH /api/patients/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @Req() req: any,
  ) {
    const patient = await this.patientService.updatePatient(
      id,
      dto,
      req.clinicId,
    );

    return {
      statusCode: 200,
      message: '患者已更新',
      data: patient,
    };
  }

  /**
   * 列舉診所患者（分頁）
   * GET /api/patients?page=1&pageSize=20
   */
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Req() req: any,
  ) {
    const result = await this.patientSearchService.getClinicPatients(
      req.clinicId,
      page,
      pageSize,
    );

    return {
      statusCode: 200,
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      },
    };
  }
}
```

設計：
- 搜尋端點支持關鍵字搜尋（身份證ID 或 姓名）
- identify 端點支持雙重驗證（高安全性）
- 標準化 RESTful 設計
- 分頁支持大量患者列表
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/patients/controllers/patient.controller.ts
    - [ ] 包含搜尋端點：grep -q "async search" backend/src/patients/controllers/patient.controller.ts
    - [ ] 包含雙重驗證：grep -q "identify" backend/src/patients/controllers/patient.controller.ts
    - [ ] 包含 CRUD 端點：grep -q "@Post\|@Patch" backend/src/patients/controllers/patient.controller.ts
  </verify>

  <done>
- PatientController 實作完整
- 包含搜尋、驗證、CRUD 端點
- 分頁支持
  </done>
</task>

<task type="auto">
  <name>任務 2：增強 PatientService 的 CRUD 方法</name>
  <files>backend/src/patients/services/patient.service.ts</files>

  <read_first>
    - backend/src/patients/services/patient-search.service.ts
    - backend/src/patients/dto/create-patient.dto.ts
    - backend/src/patients/dto/update-patient.dto.ts
  </read_first>

  <action>
在 PatientService 中實現 createPatient 和 updatePatient 方法：

```typescript
/**
 * 建立患者
 */
async createPatient(
  dto: CreatePatientDto,
  clinicId: string,
): Promise<Patient> {
  // 驗證身份證ID唯一性
  const available = await this.patientSearchService.validateIdNumberAvailability(
    dto.idNumber,
    clinicId,
  );
  if (!available) {
    throw new BadRequestException('身份證ID已存在');
  }

  const patient = this.patientRepository.create({
    ...dto,
    clinicId,
    status: 'active',
  });

  return this.patientRepository.save(patient);
}

/**
 * 編輯患者
 */
async updatePatient(
  patientId: string,
  dto: UpdatePatientDto,
  clinicId: string,
): Promise<Patient> {
  const patient = await this.patientRepository.findOne({
    where: { id: patientId, clinicId },
  });

  if (!patient) {
    throw new NotFoundException('患者不存在');
  }

  // 如果更新身份證ID，驗證新ID唯一性
  if (dto.idNumber && dto.idNumber !== patient.idNumber) {
    const available = await this.patientSearchService.validateIdNumberAvailability(
      dto.idNumber,
      clinicId,
    );
    if (!available) {
      throw new BadRequestException('身份證ID已存在');
    }
  }

  // 更新欄位
  Object.assign(patient, dto);

  return this.patientRepository.save(patient);
}
```

設計：
- 建立時驗證身份證ID唯一性
- 編輯時驗證新ID唯一性（如更改）
- 清晰的錯誤訊息
  </action>

  <verify>
    - [ ] createPatient 驗證唯一性：grep -q "validateIdNumberAvailability" backend/src/patients/services/patient.service.ts
    - [ ] updatePatient 存在：grep -q "async updatePatient" backend/src/patients/services/patient.service.ts
  </verify>

  <done>
- PatientService 包含 CRUD 方法
- 身份證ID 唯一性驗證
  </done>
</task>

</tasks>

<verification>
**API 端點驗證：**
- GET /api/patients/search - 返回搜尋結果
- GET /api/patients/identify - 雙重驗證患者
- GET /api/patients/:id - 返回患者詳情
- POST /api/patients - 建立患者返回 201
- PATCH /api/patients/:id - 更新患者
- GET /api/patients - 分頁列舉患者

**業務邏輯驗證：**
- 建立患者時驗證身份證ID唯一（診所內）
- 搜尋支持模糊匹配
- 雙重驗證功能正常
</verification>

<success_criteria>
- [ ] PatientController 包含所有端點
- [ ] PatientService 實現 CRUD 方法
- [ ] 身份證ID 唯一性驗證
- [ ] 搜尋和雙重驗證功能
- [ ] 多租戶隔離確保
</success_criteria>

<output>
完成後請建立：`.planning/phases/01-treatment-prescription-core/06-SUMMARY.md`
</output>


---
phase: 01-treatment-prescription-core
plan: 05
type: execute
wave: 2
depends_on: [02, 03]
files_modified:
  - backend/src/treatments/controllers/treatment-course.controller.ts
  - backend/src/treatments/services/treatment-course.service.ts
  - backend/src/treatments/dto/treatment-course-response.dto.ts
autonomous: true
requirements: [COURSE-01, COURSE-02, COURSE-05]
must_haves:
  truths:
    - 醫護人員能創建新療程
    - 醫護人員能編輯療程詳情
    - 患者能查看自己的療程列表與進度
  artifacts:
    - path: backend/src/treatments/controllers/treatment-course.controller.ts
      provides: 療程 API 端點
      contains: "@Post()" 和 "@Patch()"
    - path: backend/src/treatments/services/treatment-course.service.ts
      provides: 療程業務邏輯
      contains: "createCourse" 和 "updateCourse"
  key_links:
    - from: treatment-course.controller.ts
      to: treatment-progress.service.ts
      via: 進度計算
      pattern: "treatmentProgressService"
    - from: treatment-course.service.ts
      to: treatment-session.entity.ts
      via: 建立課程
      pattern: "sessionRepository"

---

<objective>
實現療程 CRUD API 和完整生命週期管理，包括創建、編輯、進度追蹤、患者查詢。

**Purpose:**
醫護人員和患者都需要通過 API 與療程互動。醫護管理、患者查詢。

**Output:**
增強的 TreatmentCourseController（CRUD 端點）、TreatmentCourseService（完整業務邏輯）。
</objective>

<execution_context>
@/home/hsu/.claude/get-shit-done/workflows/execute-plan.md
@.planning/codebase/STACK.md
@.planning/codebase/ARCHITECTURE.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 療程 API 架構

根據 RESEARCH.md 架構：
- POST /api/treatments/courses - 建立療程
- GET /api/treatments/courses/:id - 取得詳情（含進度）
- PATCH /api/treatments/courses/:id - 編輯療程
- GET /api/patients/:patientId/treatments - 患者療程列表
- POST /api/treatments/courses/:id/sessions - 完成課程（自動更新進度）

## 療程創建邏輯

輸入：療程名稱、類型、費用、療程數（課程數）
處理：建立 TreatmentCourse，然後為每個課程建立 TreatmentSession
返回：療程 ID、課程列表、初始進度

## 患者視圖

患者只能看到自己的療程，不能修改，但可以查看進度和課程完成情況。
</context>

<tasks>

<task type="auto">
  <name>任務 1：增強 TreatmentCourseService 的 CRUD 方法</name>
  <files>backend/src/treatments/services/treatment-course.service.ts</files>

  <read_first>
    - backend/src/treatments/services/treatment-course.service.ts
    - backend/src/treatments/entities/treatment-course.entity.ts
    - backend/src/treatments/entities/treatment-session.entity.ts
    - backend/src/treatments/dto/create-treatment-course.dto.ts
  </read_first>

  <action>
在 TreatmentCourseService 中添加或增強以下 CRUD 方法：

```typescript
/**
 * 建立新療程及其課程
 */
async createCourse(
  dto: CreateTreatmentCourseDto,
  patientId: string,
  clinicId: string,
): Promise<TreatmentCourse> {
  // 驗證患者存在
  const patient = await this.patientRepository.findOne({
    where: { id: patientId, clinicId },
  });
  if (!patient) {
    throw new NotFoundException('患者不存在');
  }

  // 驗證療程模板（如果提供）
  if (dto.templateId) {
    const template = await this.templateRepository.findOne({
      where: { id: dto.templateId, clinicId },
    });
    if (!template) {
      throw new NotFoundException('療程模板不存在');
    }
  }

  // 驗證療程數 > 0
  if (dto.totalSessions <= 0) {
    throw new BadRequestException('療程數必須大於 0');
  }

  // 建立療程
  const course = this.courseRepository.create({
    patientId,
    clinicId,
    name: dto.name,
    type: dto.type,
    description: dto.description,
    costPerSession: dto.costPerSession,
    totalSessions: dto.totalSessions,
    status: 'active',
    createdAt: new Date(),
  });

  // 在事務中保存療程及建立課程
  const savedCourse = await this.dataSource.transaction(
    async (manager) => {
      const saved = await manager.save(course);

      // 建立 N 個課程
      const sessions = [];
      for (let i = 1; i <= dto.totalSessions; i++) {
        const session = this.sessionRepository.create({
          treatmentCourseId: saved.id,
          sequenceNumber: i,
          status: 'pending',
          completionStatus: 'pending',
          clinicId,
          patientId,
        });
        sessions.push(session);
      }

      await manager.save(sessions);
      return saved;
    },
  );

  // 重新加載含課程
  return this.courseRepository.findOne({
    where: { id: savedCourse.id },
    relations: ['sessions'],
  });
}

/**
 * 更新療程詳情（不含課程）
 */
async updateCourse(
  courseId: string,
  dto: UpdateTreatmentCourseDto,
  clinicId: string,
): Promise<TreatmentCourse> {
  const course = await this.courseRepository.findOne({
    where: { id: courseId, clinicId },
    relations: ['sessions'],
  });

  if (!course) {
    throw new NotFoundException('療程不存在');
  }

  // 更新允許的欄位
  if (dto.name) course.name = dto.name;
  if (dto.description) course.description = dto.description;
  if (typeof dto.costPerSession !== 'undefined') {
    course.costPerSession = dto.costPerSession;
  }
  if (dto.status) {
    // 驗證狀態轉換
    const validStatuses = ['active', 'completed', 'abandoned'];
    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestException('無效的療程狀態');
    }
    course.status = dto.status;

    if (dto.status === 'completed') {
      course.completedAt = new Date();
    }
  }

  return this.courseRepository.save(course);
}

/**
 * 取得療程（含進度和課程）
 */
async getCourseById(
  courseId: string,
  clinicId: string,
): Promise<any> {
  const course = await this.courseRepository.findOne({
    where: { id: courseId, clinicId },
    relations: ['sessions', 'patient'],
  });

  if (!course) {
    throw new NotFoundException('療程不存在');
  }

  const progress = this.treatmentProgressService.getProgress(course);

  return {
    ...course,
    progress,
    staffAssignments: await this.getStaffAssignmentsForCourse(
      courseId,
      clinicId,
    ),
  };
}

/**
 * 取得患者所有療程（含進度）
 */
async getPatientCourses(
  patientId: string,
  clinicId: string,
  status?: string,
): Promise<any[]> {
  const query = this.courseRepository
    .createQueryBuilder('tc')
    .where('tc.patientId = :patientId', { patientId })
    .andWhere('tc.clinicId = :clinicId', { clinicId })
    .leftJoinAndSelect('tc.sessions', 'ts');

  if (status) {
    query.andWhere('tc.status = :status', { status });
  }

  const courses = await query.orderBy('tc.createdAt', 'DESC').getMany();

  return courses.map((course) => ({
    ...course,
    progress: this.treatmentProgressService.getProgress(course),
  }));
}

/**
 * 刪除療程（軟刪除或驗證）
 */
async deleteCourse(courseId: string, clinicId: string): Promise<void> {
  const course = await this.courseRepository.findOne({
    where: { id: courseId, clinicId },
    relations: ['sessions'],
  });

  if (!course) {
    throw new NotFoundException('療程不存在');
  }

  // 如果已開始不能刪除
  const hasStarted = course.sessions.some(
    (s) => s.completionStatus !== 'pending',
  );
  if (hasStarted) {
    throw new BadRequestException('已開始的療程不能刪除，請標記為 abandoned');
  }

  await this.courseRepository.remove(course);
}

/**
 * 取得療程所有課程
 */
async getCourseSessions(
  courseId: string,
  clinicId: string,
): Promise<TreatmentSession[]> {
  const course = await this.courseRepository.findOne({
    where: { id: courseId, clinicId },
  });

  if (!course) {
    throw new NotFoundException('療程不存在');
  }

  return this.sessionRepository.find({
    where: { treatmentCourseId: courseId },
    relations: ['staffAssignments', 'staffAssignments.staff'],
    order: { sequenceNumber: 'ASC' },
  });
}
```

設計：
- createCourse：事務包裝確保療程和課程原子性
- updateCourse：只更新療程級別資訊，不修改課程
- getCourseById：包含進度計算和醫護分配
- getPatientCourses：患者列表視圖，支持狀態過濾
- deleteCourse：驗證不能刪除已開始的療程
- getCourseSessions：返回課程詳情含醫護分配
  </action>

  <verify>
    - [ ] createCourse 方法使用事務：grep -q "dataSource.transaction" backend/src/treatments/services/treatment-course.service.ts
    - [ ] updateCourse 驗證狀態轉換：grep -q "validStatuses" backend/src/treatments/services/treatment-course.service.ts
    - [ ] getCourseById 包含進度：grep -q "treatmentProgressService.getProgress" backend/src/treatments/services/treatment-course.service.ts
    - [ ] getPatientCourses 支持狀態過濾：grep -q "if (status)" backend/src/treatments/services/treatment-course.service.ts
  </verify>

  <done>
- TreatmentCourseService 包含完整 CRUD 方法
- 事務確保原子性
- 進度計算集成
- 多租戶隔離
  </done>
</task>

<task type="auto">
  <name>任務 2：增強 TreatmentCourseController</name>
  <files>backend/src/treatments/controllers/treatment-course.controller.ts</files>

  <read_first>
    - backend/src/treatments/services/treatment-course.service.ts
    - backend/src/treatments/dto/create-treatment-course.dto.ts
    - backend/src/treatments/dto/update-treatment-course.dto.ts
  </read_first>

  <action>
建立或增強 TreatmentCourseController 包含以下端點：

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClinicContextGuard } from '@/common/guards/clinic-context.guard';
import { TreatmentCourseService } from '@/treatments/services/treatment-course.service';
import { CreateTreatmentCourseDto } from '@/treatments/dto/create-treatment-course.dto';
import { UpdateTreatmentCourseDto } from '@/treatments/dto/update-treatment-course.dto';

@ApiBearerAuth()
@ApiTags('Treatment Courses')
@Controller('api/treatments/courses')
@UseGuards(ClinicContextGuard)
export class TreatmentCourseController {
  constructor(private readonly treatmentCourseService: TreatmentCourseService) {}

  /**
   * 建立新療程
   * POST /api/treatments/courses
   */
  @Post()
  async create(
    @Body() dto: CreateTreatmentCourseDto,
    @Req() req: any,
  ) {
    const course = await this.treatmentCourseService.createCourse(
      dto,
      dto.patientId,
      req.clinicId,
    );

    return {
      statusCode: 201,
      message: '療程已建立',
      data: course,
    };
  }

  /**
   * 取得療程詳情（含進度和課程）
   * GET /api/treatments/courses/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const course = await this.treatmentCourseService.getCourseById(
      id,
      req.clinicId,
    );

    return {
      statusCode: 200,
      data: course,
    };
  }

  /**
   * 編輯療程詳情
   * PATCH /api/treatments/courses/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentCourseDto,
    @Req() req: any,
  ) {
    const course = await this.treatmentCourseService.updateCourse(
      id,
      dto,
      req.clinicId,
    );

    return {
      statusCode: 200,
      message: '療程已更新',
      data: course,
    };
  }

  /**
   * 取得患者所有療程
   * GET /api/patients/:patientId/treatments
   */
  @Get('/patient/:patientId')
  async getPatientTreatments(
    @Param('patientId') patientId: string,
    @Query('status') status?: string,
    @Req() req: any,
  ) {
    const courses = await this.treatmentCourseService.getPatientCourses(
      patientId,
      req.clinicId,
      status,
    );

    return {
      statusCode: 200,
      data: courses,
      count: courses.length,
    };
  }

  /**
   * 取得療程的所有課程
   * GET /api/treatments/courses/:id/sessions
   */
  @Get(':id/sessions')
  async getCourseSessions(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const sessions = await this.treatmentCourseService.getCourseSessions(
      id,
      req.clinicId,
    );

    return {
      statusCode: 200,
      data: sessions,
      count: sessions.length,
    };
  }

  /**
   * 刪除療程
   * DELETE /api/treatments/courses/:id
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    await this.treatmentCourseService.deleteCourse(id, req.clinicId);

    return {
      statusCode: 200,
      message: '療程已刪除',
    };
  }
}
```

設計：
- 標準化 RESTful 端點
- 所有端點都使用 ClinicContextGuard
- 返回統一格式的 API 響應
- 包含進度資訊在取得詳情時
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/treatments/controllers/treatment-course.controller.ts
    - [ ] 包含 POST 建立端點：grep -q "@Post()" backend/src/treatments/controllers/treatment-course.controller.ts
    - [ ] 包含 GET 詳情端點：grep -q "@Get(':id')" backend/src/treatments/controllers/treatment-course.controller.ts
    - [ ] 包含 PATCH 更新端點：grep -q "@Patch" backend/src/treatments/controllers/treatment-course.controller.ts
    - [ ] 包含患者療程列表：grep -q "getPatientTreatments" backend/src/treatments/controllers/treatment-course.controller.ts
  </verify>

  <done>
- TreatmentCourseController 實作完整
- 包含所有 CRUD 和查詢端點
- 進度資訊已整合
  </done>
</task>

<task type="auto">
  <name>任務 3：建立 TreatmentCourseResponseDto</name>
  <files>backend/src/treatments/dto/treatment-course-response.dto.ts</files>

  <read_first>
    - backend/src/treatments/entities/treatment-course.entity.ts
  </read_first>

  <action>
建立 TreatmentCourseResponseDto 用於標準化 API 響應：

```typescript
import { Exclude } from 'class-transformer';

export class TreatmentCourseResponseDto {
  id: string;
  patientId: string;
  clinicId: string;
  name: string;
  type: string;
  description?: string;
  costPerSession: number;
  totalSessions: number;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  // 計算欄位
  progress?: {
    totalSessions: number;
    completedSessions: number;
    pendingSessions: number;
    progressPercent: number;
    isCompleted: boolean;
  };

  sessions?: TreatmentSessionResponseDto[];
}

export class TreatmentSessionResponseDto {
  id: string;
  treatmentCourseId: string;
  sequenceNumber: number;
  status: string;
  completionStatus: 'pending' | 'completed' | 'abandoned';
  completedAt?: Date;
  createdAt: Date;

  staffAssignments?: {
    id: string;
    staffId: string;
    staffName: string;
    assignedAt: Date;
  }[];
}

/**
 * 患者視圖 DTO（隱藏某些敏感資訊）
 */
export class TreatmentCoursePatientViewDto {
  id: string;
  name: string;
  type: string;
  description?: string;
  costPerSession: number;
  totalSessions: number;
  status: string;
  createdAt: Date;

  progress?: {
    totalSessions: number;
    completedSessions: number;
    progressPercent: number;
  };

  sessions?: Omit<TreatmentSessionResponseDto, 'treatmentCourseId'>[];

  @Exclude()
  clinicId: string;

  @Exclude()
  patientId: string;
}
```

設計：
- TreatmentCourseResponseDto：完整療程資訊
- 包含進度計算物件
- TreatmentSessionResponseDto：課程詳情含醫護分配
- TreatmentCoursePatientViewDto：患者視圖，隱藏診所和患者 ID
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/treatments/dto/treatment-course-response.dto.ts
    - [ ] 包含 TreatmentCourseResponseDto：grep -q "export class TreatmentCourseResponseDto" backend/src/treatments/dto/treatment-course-response.dto.ts
    - [ ] 包含進度物件：grep -q "progress\?" backend/src/treatments/dto/treatment-course-response.dto.ts
    - [ ] 包含患者視圖 DTO：grep -q "TreatmentCoursePatientViewDto" backend/src/treatments/dto/treatment-course-response.dto.ts
  </verify>

  <done>
- ResponseDto 定義完整
- 支持不同視圖（醫護 vs 患者）
- 包含進度資訊
  </done>
</task>

</tasks>

<verification>
**API 端點驗證：**
- POST /api/treatments/courses - 建立療程返回 201
- GET /api/treatments/courses/:id - 返回詳情含進度
- PATCH /api/treatments/courses/:id - 更新療程
- GET /api/patients/:patientId/treatments - 患者療程列表
- GET /api/treatments/courses/:id/sessions - 療程課程列表
- DELETE /api/treatments/courses/:id - 刪除療程

**業務邏輯驗證：**
- 建立療程時自動建立指定數量的課程（事務包裝）
- 課程完成時自動更新療程進度
- 患者只能查看自己的療程（clinicId 隔離）
- 進度計算百分比正確
</verification>

<success_criteria>
- [ ] TreatmentCourseService 包含完整 CRUD 方法
- [ ] TreatmentCourseController 包含所有 REST 端點
- [ ] 建立療程時自動生成課程（事務處理）
- [ ] 進度計算已整合
- [ ] 患者列表端點支持狀態過濾
- [ ] DTO 驗證和響應格式化
</success_criteria>

<output>
完成後請建立文件：
`.planning/phases/01-treatment-prescription-core/05-SUMMARY.md`

紀錄：
- 增強的服務：TreatmentCourseService（完整 CRUD）
- 增強的控制器：TreatmentCourseController（REST API）
- API 端點：POST、GET、PATCH、DELETE
- 患者查詢端點：GET /api/patients/:patientId/treatments
</output>


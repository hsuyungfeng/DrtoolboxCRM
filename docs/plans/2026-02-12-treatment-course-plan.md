# 療程模板和時間戳追蹤系統 - 實施計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 實現完整的療程管理系統，支持課程模板、詳細的單次療程追蹤、以及靈活的多治療師 PPF 分配。

**Architecture:**
- 後端：6 個新 Entity、5 個 Service、1 個 Controller、1 個 EventListener、多個 DTO
- 前端：患者詳情頁面新增「療程歷史」分頁、新建中央「療程管理」頁面
- 集成：與 Points 系統、Referrals 系統、事件驅動架構集成

**Tech Stack:** NestJS, TypeORM, SQLite, Vue 3, Naive UI, EventEmitter2, TDD (Jest)

---

## Phase 1: 後端 Entities 和 DTOs

### Task 1: 建立 TreatmentCourseTemplate Entity

**檔案:**
- Create: `src/treatments/entities/treatment-course-template.entity.ts`
- Create: `src/treatments/entities/treatment-course-template.entity.spec.ts`
- Modify: `src/database/database.config.ts` - 添加 entity 到列表

**Step 1: 寫入失敗的測試**

```typescript
// src/treatments/entities/treatment-course-template.entity.spec.ts
describe('TreatmentCourseTemplate Entity', () => {
  it('should create a template with all required fields', () => {
    const template = new TreatmentCourseTemplate();
    template.id = 'tmpl-001';
    template.name = '10次美容套餐';
    template.description = '完整的美容療程';
    template.totalSessions = 10;
    template.totalPrice = new Decimal('5000.00');
    template.stageConfig = [
      { stageName: '基礎治療', sessionStart: 1, sessionEnd: 3 },
      { stageName: '進階治療', sessionStart: 4, sessionEnd: 7 },
      { stageName: '維護', sessionStart: 8, sessionEnd: 10 }
    ];
    template.clinicId = 'clinic-001';
    template.isActive = true;

    expect(template.id).toBe('tmpl-001');
    expect(template.totalSessions).toBe(10);
    expect(template.totalPrice.toNumber()).toBe(5000);
    expect(template.stageConfig.length).toBe(3);
  });

  it('should have default isActive = true', () => {
    const template = new TreatmentCourseTemplate();
    expect(template.isActive).toBe(true);
  });
});
```

**Step 2: 運行測試確認失敗**

```bash
cd /home/hsu/CRMapp/doctor-crm/backend
npm test -- src/treatments/entities/treatment-course-template.entity.spec.ts
```

預期：FAIL - "TreatmentCourseTemplate is not defined"

**Step 3: 實現 Entity**

```typescript
// src/treatments/entities/treatment-course-template.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import Decimal from 'decimal.js';

interface StageConfig {
  stageName: string;
  sessionStart: number;
  sessionEnd: number;
}

@Entity('treatment_course_templates')
@Index(['clinicId', 'isActive'])
export class TreatmentCourseTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  totalSessions: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: Decimal | number) => value,
      from: (value: string) => new Decimal(value),
    }
  })
  totalPrice: Decimal;

  @Column({ type: 'json' })
  stageConfig: StageConfig[];

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 4: 運行測試確認通過**

```bash
npm test -- src/treatments/entities/treatment-course-template.entity.spec.ts
```

預期：PASS - "TreatmentCourseTemplate Entity ✓"

**Step 5: 更新 database.config.ts**

```typescript
// src/database/database.config.ts - 在 entities 陣列中添加
import { TreatmentCourseTemplate } from '../treatments/entities/treatment-course-template.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  // ... 其他配置
  entities: [
    // ... 現有 entities
    TreatmentCourseTemplate,
  ],
};
```

**Step 6: 提交**

```bash
git add src/treatments/entities/treatment-course-template.entity.ts \
         src/treatments/entities/treatment-course-template.entity.spec.ts \
         src/database/database.config.ts
git commit -m "feat: add TreatmentCourseTemplate entity with stage configuration"
```

---

### Task 2: 建立 TreatmentCourse Entity

**檔案:**
- Create: `src/treatments/entities/treatment-course.entity.ts`
- Create: `src/treatments/entities/treatment-course.entity.spec.ts`
- Modify: `src/database/database.config.ts`

**Step 1-2: 寫入測試並運行（失敗）**

```typescript
// src/treatments/entities/treatment-course.entity.spec.ts
describe('TreatmentCourse Entity', () => {
  it('should create a course with all required fields', () => {
    const course = new TreatmentCourse();
    course.id = 'course-001';
    course.patientId = 'patient-123';
    course.templateId = 'tmpl-001';
    course.status = 'active';
    course.purchaseDate = new Date('2026-02-12');
    course.purchaseAmount = new Decimal('5000.00');
    course.pointsRedeemed = new Decimal('500.00');
    course.actualPayment = new Decimal('4500.00');
    course.clinicId = 'clinic-001';

    expect(course.status).toBe('active');
    expect(course.actualPayment.toNumber()).toBe(4500);
  });

  it('should track completion date when course is completed', () => {
    const course = new TreatmentCourse();
    course.status = 'completed';
    course.completedAt = new Date('2026-12-12');

    expect(course.completedAt).toBeDefined();
  });
});
```

**Step 3: 實現 Entity**

```typescript
// src/treatments/entities/treatment-course.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index, FK } from 'typeorm';
import Decimal from 'decimal.js';
import { Patient } from '../../patients/entities/patient.entity';
import { TreatmentSession } from './treatment-session.entity';

@Entity('treatment_courses')
@Index(['patientId', 'clinicId'])
@Index(['clinicId', 'status'])
export class TreatmentCourse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  patientId: string;

  @Column({ type: 'varchar', length: 32 })
  templateId: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: 'active' | 'completed' | 'abandoned';

  @Column({ type: 'date' })
  purchaseDate: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: Decimal | number) => value,
      from: (value: string) => new Decimal(value),
    }
  })
  purchaseAmount: Decimal;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: Decimal | number) => value,
      from: (value: string) => new Decimal(value),
    }
  })
  pointsRedeemed: Decimal;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: Decimal | number) => value,
      from: (value: string) => new Decimal(value),
    }
  })
  actualPayment: Decimal;

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 關聯
  @ManyToOne(() => Patient, { eager: false })
  patient: Patient;

  @OneToMany(() => TreatmentSession, (session) => session.treatmentCourse)
  sessions: TreatmentSession[];
}
```

**Step 4-6: 測試、提交**

```bash
npm test -- src/treatments/entities/treatment-course.entity.spec.ts
git add src/treatments/entities/treatment-course.entity.ts \
         src/treatments/entities/treatment-course.entity.spec.ts \
         src/database/database.config.ts
git commit -m "feat: add TreatmentCourse entity with purchase and payment tracking"
```

---

### Task 3: 建立 TreatmentSession 和 StaffAssignment Entities

**檔案:**
- Create: `src/treatments/entities/treatment-session.entity.ts`
- Create: `src/treatments/entities/staff-assignment.entity.ts`
- Create: `src/treatments/entities/treatment-session.entity.spec.ts`
- Modify: `src/database/database.config.ts`

**Step 1-2: 寫入測試並運行（失敗）**

```typescript
// src/treatments/entities/treatment-session.entity.spec.ts
describe('TreatmentSession Entity', () => {
  it('should create a session with all required fields', () => {
    const session = new TreatmentSession();
    session.id = 'session-001';
    session.treatmentCourseId = 'course-001';
    session.sessionNumber = 1;
    session.scheduledDate = new Date('2026-02-20');
    session.completionStatus = 'pending';
    session.sessionPrice = new Decimal('500.00');
    session.clinicId = 'clinic-001';

    expect(session.sessionNumber).toBe(1);
    expect(session.completionStatus).toBe('pending');
  });

  it('should track actual start and end times when completed', () => {
    const session = new TreatmentSession();
    session.completionStatus = 'completed';
    session.actualStartTime = new Date('2026-02-20T10:00:00');
    session.actualEndTime = new Date('2026-02-20T11:00:00');

    expect(session.actualStartTime).toBeDefined();
    expect(session.actualEndTime).toBeDefined();
  });

  it('should track therapist notes and patient feedback', () => {
    const session = new TreatmentSession();
    session.therapistNotes = '患者反應良好';
    session.patientFeedback = '感覺很舒服';

    expect(session.therapistNotes).toBe('患者反應良好');
    expect(session.patientFeedback).toBe('感覺很舒服');
  });
});

describe('StaffAssignment Entity', () => {
  it('should assign staff with PPF percentage', () => {
    const assignment = new StaffAssignment();
    assignment.id = 'assign-001';
    assignment.sessionId = 'session-001';
    assignment.staffId = 'staff-123';
    assignment.staffRole = 'DOCTOR';
    assignment.ppfPercentage = new Decimal('60.00');

    expect(assignment.ppfPercentage.toNumber()).toBe(60);
  });

  it('should track calculated PPF amount', () => {
    const assignment = new StaffAssignment();
    assignment.ppfAmount = new Decimal('300.00');

    expect(assignment.ppfAmount.toNumber()).toBe(300);
  });
});
```

**Step 3: 實現 Entities**

```typescript
// src/treatments/entities/treatment-session.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import Decimal from 'decimal.js';
import { TreatmentCourse } from './treatment-course.entity';
import { StaffAssignment } from './staff-assignment.entity';

@Entity('treatment_sessions')
@Index(['treatmentCourseId', 'sessionNumber'])
@Index(['clinicId', 'completionStatus'])
@Index(['clinicId', 'scheduledDate'])
export class TreatmentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  treatmentCourseId: string;

  @Column({ type: 'int' })
  sessionNumber: number; // 1-10

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'datetime', nullable: true })
  actualStartTime: Date;

  @Column({ type: 'datetime', nullable: true })
  actualEndTime: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  completionStatus: 'pending' | 'completed' | 'cancelled';

  @Column({ type: 'text', nullable: true })
  therapistNotes: string;

  @Column({ type: 'text', nullable: true })
  patientFeedback: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: Decimal | number) => value,
      from: (value: string) => new Decimal(value),
    }
  })
  sessionPrice: Decimal;

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 關聯
  @ManyToOne(() => TreatmentCourse, (course) => course.sessions)
  treatmentCourse: TreatmentCourse;

  @OneToMany(() => StaffAssignment, (assignment) => assignment.session)
  staffAssignments: StaffAssignment[];
}
```

```typescript
// src/treatments/entities/staff-assignment.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import Decimal from 'decimal.js';
import { TreatmentSession } from './treatment-session.entity';

@Entity('staff_assignments')
@Index(['sessionId', 'staffId'])
export class StaffAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  sessionId: string;

  @Column({ type: 'varchar', length: 32 })
  staffId: string;

  @Column({ type: 'varchar', length: 50 })
  staffRole: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: Decimal | number) => value,
      from: (value: string) => new Decimal(value),
    }
  })
  ppfPercentage: Decimal; // 0-100

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: Decimal | number) => value,
      from: (value: string) => new Decimal(value),
    }
  })
  ppfAmount: Decimal; // 計算後的實際 PPF

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 關聯
  @ManyToOne(() => TreatmentSession, (session) => session.staffAssignments)
  session: TreatmentSession;
}
```

**Step 4-6: 測試、提交**

```bash
npm test -- src/treatments/entities/treatment-session.entity.spec.ts
git add src/treatments/entities/treatment-session.entity.ts \
         src/treatments/entities/staff-assignment.entity.ts \
         src/treatments/entities/treatment-session.entity.spec.ts \
         src/database/database.config.ts
git commit -m "feat: add TreatmentSession and StaffAssignment entities"
```

---

### Task 4: 建立 DTOs

**檔案:**
- Create: `src/treatments/dto/create-treatment-course.dto.ts`
- Create: `src/treatments/dto/create-treatment-session.dto.ts`
- Create: `src/treatments/dto/update-treatment-session.dto.ts`
- Create: `src/treatments/dto/staff-assignment.dto.ts`
- Create: `src/treatments/dto/*.spec.ts` (測試檔案)

**Step 1-2: 寫入測試並運行（失敗）**

```typescript
// src/treatments/dto/create-treatment-course.dto.spec.ts
import { validate } from 'class-validator';
import { CreateTreatmentCourseDto } from './create-treatment-course.dto';

describe('CreateTreatmentCourseDto', () => {
  it('should validate correct DTO', async () => {
    const dto = new CreateTreatmentCourseDto();
    dto.patientId = 'patient-123';
    dto.templateId = 'tmpl-001';
    dto.clinicId = 'clinic-001';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when patientId is empty', async () => {
    const dto = new CreateTreatmentCourseDto();
    dto.patientId = '';
    dto.templateId = 'tmpl-001';
    dto.clinicId = 'clinic-001';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

**Step 3: 實現 DTOs**

```typescript
// src/treatments/dto/create-treatment-course.dto.ts
import { IsNotEmpty, IsString, IsUUID, IsNumber, Min, IsOptional } from 'class-validator';
import Decimal from 'decimal.js';

export class CreateTreatmentCourseDto {
  @IsNotEmpty({ message: 'patientId 不能為空' })
  @IsString()
  patientId: string;

  @IsNotEmpty({ message: 'templateId 不能為空' })
  @IsUUID()
  templateId: string;

  @IsNotEmpty({ message: 'clinicId 不能為空' })
  @IsUUID()
  clinicId: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'pointsToRedeem 必須是有效的數字' })
  @Min(0, { message: 'pointsToRedeem 不能為負' })
  pointsToRedeem?: number;
}
```

```typescript
// src/treatments/dto/update-treatment-session.dto.ts
import { IsOptional, IsDate, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import Decimal from 'decimal.js';

export class UpdateTreatmentSessionDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'scheduledDate 必須是有效日期' })
  scheduledDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'actualStartTime 必須是有效時間戳' })
  actualStartTime?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'actualEndTime 必須是有效時間戳' })
  actualEndTime?: Date;

  @IsOptional()
  @IsEnum(['pending', 'completed', 'cancelled'])
  completionStatus?: 'pending' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  therapistNotes?: string;

  @IsOptional()
  @IsString()
  patientFeedback?: string;

  @IsOptional()
  staffAssignments?: StaffAssignmentDto[];
}

export class StaffAssignmentDto {
  @IsNotEmpty()
  @IsString()
  staffId: string;

  @IsNotEmpty()
  @IsString()
  staffRole: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'ppfPercentage 不能為負' })
  @Max(100, { message: 'ppfPercentage 不能超過 100' })
  ppfPercentage: number;
}
```

**Step 4-6: 測試、提交**

```bash
npm test -- src/treatments/dto/*.spec.ts
git add src/treatments/dto/
git commit -m "feat: add DTOs for treatment course and session management"
```

---

## Phase 2: 後端 Services

### Task 5: 實現 TreatmentCourseTemplateService

**檔案:**
- Create: `src/treatments/services/treatment-course-template.service.ts`
- Create: `src/treatments/services/treatment-course-template.service.spec.ts`

**Step 1-3: 寫入測試、實現、驗證**

```typescript
// src/treatments/services/treatment-course-template.service.spec.ts
describe('TreatmentCourseTemplateService', () => {
  let service: TreatmentCourseTemplateService;
  let repository: Repository<TreatmentCourseTemplate>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentCourseTemplateService,
        {
          provide: getRepositoryToken(TreatmentCourseTemplate),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TreatmentCourseTemplateService>(TreatmentCourseTemplateService);
    repository = module.get<Repository<TreatmentCourseTemplate>>(
      getRepositoryToken(TreatmentCourseTemplate),
    );
  });

  it('should return all active templates for a clinic', async () => {
    const template = new TreatmentCourseTemplate();
    template.id = 'tmpl-001';
    template.name = '10次美容套餐';
    template.isActive = true;
    template.clinicId = 'clinic-001';

    jest.spyOn(repository, 'find').mockResolvedValue([template]);

    const result = await service.getActiveTemplates('clinic-001');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('10次美容套餐');
  });

  it('should return template by ID', async () => {
    const template = new TreatmentCourseTemplate();
    template.id = 'tmpl-001';

    jest.spyOn(repository, 'findOne').mockResolvedValue(template);

    const result = await service.getTemplateById('tmpl-001', 'clinic-001');
    expect(result.id).toBe('tmpl-001');
  });
});
```

**實現:**

```typescript
// src/treatments/services/treatment-course-template.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentCourseTemplate } from '../entities/treatment-course-template.entity';

@Injectable()
export class TreatmentCourseTemplateService {
  constructor(
    @InjectRepository(TreatmentCourseTemplate)
    private readonly templateRepository: Repository<TreatmentCourseTemplate>,
  ) {}

  async getActiveTemplates(clinicId: string): Promise<TreatmentCourseTemplate[]> {
    return this.templateRepository.find({
      where: { clinicId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getTemplateById(templateId: string, clinicId: string): Promise<TreatmentCourseTemplate> {
    return this.templateRepository.findOne({
      where: { id: templateId, clinicId },
    });
  }

  async createTemplate(data: Partial<TreatmentCourseTemplate>): Promise<TreatmentCourseTemplate> {
    return this.templateRepository.save(data);
  }
}
```

**Step 4-6: 測試、提交**

```bash
npm test -- src/treatments/services/treatment-course-template.service.spec.ts
git add src/treatments/services/treatment-course-template.service.ts \
         src/treatments/services/treatment-course-template.service.spec.ts
git commit -m "feat: add TreatmentCourseTemplateService with query methods"
```

---

### Task 6: 實現 TreatmentCourseService

**檔案:**
- Create: `src/treatments/services/treatment-course.service.ts`
- Create: `src/treatments/services/treatment-course.service.spec.ts`

**關鍵方法:**
- `createCourse()` - 建立套餐，生成 10 個空 sessions，可選抵扣點數
- `getCourseById()` - 查詢套餐
- `getPatientCourses()` - 查詢患者的所有套餐

**實現示例 (完整實現會更長):**

```typescript
// src/treatments/services/treatment-course.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TreatmentCourse } from '../entities/treatment-course.entity';
import { TreatmentSession } from '../entities/treatment-session.entity';
import { CreateTreatmentCourseDto } from '../dto/create-treatment-course.dto';
import { TreatmentCourseTemplateService } from './treatment-course-template.service';
import { PointsService } from '../../points/services/points.service';
import Decimal from 'decimal.js';

@Injectable()
export class TreatmentCourseService {
  constructor(
    @InjectRepository(TreatmentCourse)
    private readonly courseRepository: Repository<TreatmentCourse>,
    @InjectRepository(TreatmentSession)
    private readonly sessionRepository: Repository<TreatmentSession>,
    private readonly templateService: TreatmentCourseTemplateService,
    private readonly pointsService: PointsService,
    private readonly dataSource: DataSource,
  ) {}

  async createCourse(dto: CreateTreatmentCourseDto): Promise<TreatmentCourse> {
    // 1. 驗證模板存在
    const template = await this.templateService.getTemplateById(dto.templateId, dto.clinicId);
    if (!template) throw new NotFoundException('課程模板不存在');

    // 2. 計算實際支付金額
    const pointsRedeemed = new Decimal(dto.pointsToRedeem || 0);
    const actualPayment = new Decimal(template.totalPrice).minus(pointsRedeemed);

    if (actualPayment.lessThanOrEqualTo(0)) {
      throw new BadRequestException('點數抵扣金額不能超過套餐價格');
    }

    // 3. 在事務中建立套餐和 sessions
    return await this.dataSource.transaction(async (manager) => {
      // 建立套餐
      const course = new TreatmentCourse();
      course.patientId = dto.patientId;
      course.templateId = dto.templateId;
      course.status = 'active';
      course.purchaseDate = new Date();
      course.purchaseAmount = template.totalPrice;
      course.pointsRedeemed = pointsRedeemed;
      course.actualPayment = actualPayment;
      course.clinicId = dto.clinicId;

      const savedCourse = await manager.save(course);

      // 生成 10 個空 sessions
      const sessionPrice = actualPayment.dividedBy(template.totalSessions);
      for (let i = 1; i <= template.totalSessions; i++) {
        const session = new TreatmentSession();
        session.treatmentCourseId = savedCourse.id;
        session.sessionNumber = i;
        session.scheduledDate = null; // 預定日期待定
        session.completionStatus = 'pending';
        session.sessionPrice = sessionPrice;
        session.clinicId = dto.clinicId;

        await manager.save(session);
      }

      // 如有點數抵扣，更新 patient 的 pointsBalance
      if (pointsRedeemed.greaterThan(0)) {
        await this.pointsService.redeemPoints(
          dto.patientId,
          pointsRedeemed.toNumber(),
          dto.clinicId,
        );
      }

      return savedCourse;
    });
  }

  async getCourseById(courseId: string, clinicId: string): Promise<TreatmentCourse> {
    return this.courseRepository.findOne({
      where: { id: courseId, clinicId },
      relations: ['sessions', 'sessions.staffAssignments'],
    });
  }

  async getPatientCourses(patientId: string, clinicId: string): Promise<TreatmentCourse[]> {
    return this.courseRepository.find({
      where: { patientId, clinicId },
      relations: ['sessions'],
      order: { createdAt: 'DESC' },
    });
  }
}
```

**Step 4-6: 測試、提交**

```bash
npm test -- src/treatments/services/treatment-course.service.spec.ts
git add src/treatments/services/treatment-course.service.ts \
         src/treatments/services/treatment-course.service.spec.ts
git commit -m "feat: add TreatmentCourseService with course creation and point deduction"
```

---

### Task 7: 實現 PPFCalculationService

**檔案:**
- Create: `src/treatments/services/ppf-calculation.service.ts`
- Create: `src/treatments/services/ppf-calculation.service.spec.ts`

**關鍵方法:**
- `calculateSessionPPF(sessionId, paymentAmount)` - 計算該 session 的 PPF
- `validateStaffAssignments(assignments)` - 驗證百分比加總為 100%
- `distributeToStaff(ppfAmount, assignments)` - 根據百分比分配 PPF

**實現:**

```typescript
// src/treatments/services/ppf-calculation.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffAssignment } from '../entities/staff-assignment.entity';
import Decimal from 'decimal.js';

@Injectable()
export class PPFCalculationService {
  constructor(
    @InjectRepository(StaffAssignment)
    private readonly assignmentRepository: Repository<StaffAssignment>,
  ) {}

  validateStaffAssignments(assignments: { ppfPercentage: number }[]): boolean {
    if (!assignments || assignments.length === 0) {
      throw new BadRequestException('必須至少指派一位治療師');
    }

    const totalPercentage = assignments.reduce(
      (sum, a) => sum + new Decimal(a.ppfPercentage).toNumber(),
      0,
    );

    if (totalPercentage !== 100) {
      throw new BadRequestException(`治療師 PPF 百分比必須等於 100%，目前為 ${totalPercentage}%`);
    }

    return true;
  }

  calculateStaffPPF(paymentAmount: Decimal, ppfPercentage: Decimal): Decimal {
    return paymentAmount.multipliedBy(ppfPercentage).dividedBy(100);
  }

  async distributeToStaff(
    sessionId: string,
    paymentAmount: Decimal,
    assignments: StaffAssignment[],
  ): Promise<StaffAssignment[]> {
    this.validateStaffAssignments(assignments);

    const updatedAssignments = assignments.map((assignment) => {
      assignment.ppfAmount = this.calculateStaffPPF(
        paymentAmount,
        new Decimal(assignment.ppfPercentage),
      );
      return assignment;
    });

    return this.assignmentRepository.save(updatedAssignments);
  }
}
```

**Step 4-6: 測試、提交**

```bash
npm test -- src/treatments/services/ppf-calculation.service.spec.ts
git add src/treatments/services/ppf-calculation.service.ts \
         src/treatments/services/ppf-calculation.service.spec.ts
git commit -m "feat: add PPFCalculationService for flexible staff PPF distribution"
```

---

### Task 8: 實現 TreatmentSessionService

**檔案:**
- Create: `src/treatments/services/treatment-session.service.ts`
- Create: `src/treatments/services/treatment-session.service.spec.ts`

**關鍵方法:**
- `updateSession(sessionId, updateDto)` - 更新 session（時間戳、狀態、備註、治療師分配）
- `completeSession(sessionId, updateDto)` - 完成 session 並觸發 PPF 計算
- `getStaffSessions(staffId, clinicId)` - 查詢治療師的 sessions

**核心邏輯 (completeSession):**

```typescript
async completeSession(
  sessionId: string,
  updateDto: UpdateTreatmentSessionDto,
  clinicId: string,
): Promise<TreatmentSession> {
  return await this.dataSource.transaction(async (manager) => {
    // 1. 查詢 session 和 course
    const session = await manager.findOne(TreatmentSession, {
      where: { id: sessionId, clinicId },
      relations: ['treatmentCourse', 'staffAssignments'],
    });

    if (!session) throw new NotFoundException('療程不存在');
    if (session.completionStatus !== 'pending') {
      throw new BadRequestException('只有待執行的療程才能標記為完成');
    }

    // 2. 更新 session 信息
    session.actualStartTime = updateDto.actualStartTime;
    session.actualEndTime = updateDto.actualEndTime;
    session.completionStatus = 'completed';
    session.therapistNotes = updateDto.therapistNotes;
    session.patientFeedback = updateDto.patientFeedback;

    // 3. 更新治療師分配
    if (updateDto.staffAssignments) {
      // 驗證百分比
      this.ppfCalculationService.validateStaffAssignments(updateDto.staffAssignments);

      // 刪除舊分配
      await manager.delete(StaffAssignment, { sessionId });

      // 建立新分配並計算 PPF
      const assignments = updateDto.staffAssignments.map((dto) => {
        const assignment = new StaffAssignment();
        assignment.sessionId = sessionId;
        assignment.staffId = dto.staffId;
        assignment.staffRole = dto.staffRole;
        assignment.ppfPercentage = new Decimal(dto.ppfPercentage);
        return assignment;
      });

      // 計算 PPF（基於實際支付金額）
      const paymentAmount = session.treatmentCourse.actualPayment.dividedBy(
        session.treatmentCourse.totalSessions,
      );
      const distributedAssignments = await this.ppfCalculationService.distributeToStaff(
        sessionId,
        paymentAmount,
        assignments,
      );

      session.staffAssignments = distributedAssignments;
    }

    // 4. 保存 session
    const savedSession = await manager.save(session);

    // 5. 發送 'session.completed' 事件
    this.eventEmitter.emit('session.completed', {
      sessionId: savedSession.id,
      treatmentCourseId: savedSession.treatmentCourseId,
      patientId: session.treatmentCourse.patientId,
      completedAt: new Date(),
      staffAssignments: session.staffAssignments,
    });

    // 6. 如果所有 sessions 都完成，更新 course 狀態
    const allSessions = await manager.find(TreatmentSession, {
      where: { treatmentCourseId: session.treatmentCourseId },
    });

    const completedCount = allSessions.filter((s) => s.completionStatus === 'completed').length;
    if (completedCount === allSessions.length) {
      const course = session.treatmentCourse;
      course.status = 'completed';
      course.completedAt = new Date();
      await manager.save(course);
    }

    return savedSession;
  });
}
```

**Step 4-6: 測試、提交**

```bash
npm test -- src/treatments/services/treatment-session.service.spec.ts
git add src/treatments/services/treatment-session.service.ts \
         src/treatments/services/treatment-session.service.spec.ts
git commit -m "feat: add TreatmentSessionService with session completion and PPF calculation"
```

---

## Phase 3: 後端 Controller 和 Module

### Task 9: 實現 TreatmentController

**檔案:**
- Create: `src/treatments/controllers/treatment.controller.ts`
- Create: `src/treatments/controllers/treatment.controller.spec.ts`

**API 端點:**
```
POST   /treatments/courses                    - 建立套餐
GET    /treatments/courses/:courseId          - 查詢套餐
PUT    /treatments/sessions/:sessionId        - 更新 session
GET    /patients/:patientId/courses           - 查詢患者的套餐
GET    /staff/:staffId/sessions               - 查詢治療師的 sessions
```

**實現 (部分):**

```typescript
// src/treatments/controllers/treatment.controller.ts
import { Controller, Post, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TreatmentCourseService } from '../services/treatment-course.service';
import { TreatmentSessionService } from '../services/treatment-session.service';
import { TreatmentCourseTemplateService } from '../services/treatment-course-template.service';
import { CreateTreatmentCourseDto } from '../dto/create-treatment-course.dto';
import { UpdateTreatmentSessionDto } from '../dto/update-treatment-session.dto';

@Controller('treatments')
@UseGuards(JwtAuthGuard)
export class TreatmentController {
  constructor(
    private readonly courseService: TreatmentCourseService,
    private readonly sessionService: TreatmentSessionService,
    private readonly templateService: TreatmentCourseTemplateService,
  ) {}

  @Post('courses')
  async createCourse(@Body() dto: CreateTreatmentCourseDto) {
    return this.courseService.createCourse(dto);
  }

  @Get('courses/:courseId')
  async getCourse(@Param('courseId') courseId: string, @Query('clinicId') clinicId: string) {
    return this.courseService.getCourseById(courseId, clinicId);
  }

  @Get('templates')
  async getTemplates(@Query('clinicId') clinicId: string) {
    return this.templateService.getActiveTemplates(clinicId);
  }

  @Put('sessions/:sessionId')
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateTreatmentSessionDto,
    @Query('clinicId') clinicId: string,
  ) {
    return this.sessionService.completeSession(sessionId, dto, clinicId);
  }
}
```

**Step 4-6: 測試、提交**

```bash
npm test -- src/treatments/controllers/treatment.controller.spec.ts
git add src/treatments/controllers/treatment.controller.ts \
         src/treatments/controllers/treatment.controller.spec.ts
git commit -m "feat: add TreatmentController with REST API endpoints"
```

---

### Task 10: 建立 TreatmentsModule 和集成

**檔案:**
- Create: `src/treatments/treatments.module.ts`
- Modify: `src/app.module.ts` - 導入 TreatmentsModule
- Modify: `src/database/database.config.ts` - 已在之前的 tasks 中進行

**實現:**

```typescript
// src/treatments/treatments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentCourseTemplate } from './entities/treatment-course-template.entity';
import { TreatmentCourse } from './entities/treatment-course.entity';
import { TreatmentSession } from './entities/treatment-session.entity';
import { StaffAssignment } from './entities/staff-assignment.entity';
import { TreatmentCourseService } from './services/treatment-course.service';
import { TreatmentCourseTemplateService } from './services/treatment-course-template.service';
import { TreatmentSessionService } from './services/treatment-session.service';
import { PPFCalculationService } from './services/ppf-calculation.service';
import { TreatmentController } from './controllers/treatment.controller';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TreatmentCourseTemplate,
      TreatmentCourse,
      TreatmentSession,
      StaffAssignment,
    ]),
    PointsModule,
  ],
  controllers: [TreatmentController],
  providers: [
    TreatmentCourseService,
    TreatmentCourseTemplateService,
    TreatmentSessionService,
    PPFCalculationService,
  ],
  exports: [TreatmentCourseService, TreatmentSessionService],
})
export class TreatmentsModule {}
```

**Step 4-6: 測試、提交**

```bash
# 修改 app.module.ts
# 在 imports 陣列中添加 TreatmentsModule

npm run build
git add src/treatments/treatments.module.ts \
         src/app.module.ts
git commit -m "feat: add TreatmentsModule and integrate with AppModule"
```

---

## Phase 4: 前端 - 患者詳情頁面

### Task 11: 添加患者詳情頁面 - 療程歷史分頁

**檔案:**
- Modify: `src/views/patients/PatientDetailView.vue`
- Create: `src/components/patients/TreatmentHistoryTab.vue`
- Create: `src/components/patients/TreatmentSessionTable.vue`
- Create: `src/components/patients/SessionEditModal.vue`

**步驟 (簡化):**

1. 在患者詳情頁添加「療程歷史」分頁
2. 顯示現有套餐列表
3. 點擊套餐查看 1-10 次療程的表格
4. 點擊編輯按鈕打開模態框，更新 session 信息

**關鍵代碼:**

```vue
<!-- src/components/patients/TreatmentHistoryTab.vue -->
<template>
  <div class="treatment-history">
    <n-button type="primary" @click="showCreateCourseModal = true">
      新增套餐
    </n-button>

    <div class="courses-list">
      <n-card v-for="course in courses" :key="course.id">
        <div class="course-header">
          <h4>{{ course.templateName }}</h4>
          <n-progress
            :percentage="(course.completedCount / course.totalSessions) * 100"
            :status="course.status === 'completed' ? 'success' : 'default'"
          />
        </div>
        <p>購買日期: {{ course.purchaseDate }}</p>
        <p>總金額: {{ course.purchaseAmount }} 元</p>
        <n-button text @click="showCourseDetails(course)">查看詳情</n-button>
      </n-card>
    </div>

    <!-- 套餐詳情模態框 -->
    <n-modal v-model:show="showDetailsModal">
      <TreatmentSessionTable :course="selectedCourse" @edit="handleEditSession" />
    </n-modal>

    <!-- Session 編輯模態框 -->
    <SessionEditModal
      v-model:show="showSessionEditModal"
      :session="selectedSession"
      @save="handleSaveSession"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NButton, NCard, NProgress, NModal } from 'naive-ui';
import TreatmentSessionTable from './TreatmentSessionTable.vue';
import SessionEditModal from './SessionEditModal.vue';
import * as treatmentsApi from '@/api/treatments';

const props = defineProps({
  patientId: String,
  clinicId: String,
});

const courses = ref([]);
const selectedCourse = ref(null);
const selectedSession = ref(null);
const showDetailsModal = ref(false);
const showSessionEditModal = ref(false);
const showCreateCourseModal = ref(false);

onMounted(async () => {
  courses.value = await treatmentsApi.getPatientCourses(props.patientId, props.clinicId);
});

const showCourseDetails = (course) => {
  selectedCourse.value = course;
  showDetailsModal.value = true;
};

const handleEditSession = (session) => {
  selectedSession.value = session;
  showSessionEditModal.value = true;
};

const handleSaveSession = async (updatedSession) => {
  await treatmentsApi.updateSession(updatedSession.id, updatedSession, props.clinicId);
  // 重新加載數據
  courses.value = await treatmentsApi.getPatientCourses(props.patientId, props.clinicId);
  showSessionEditModal.value = false;
};
</script>
```

**前端 API Service:**

```typescript
// src/api/treatments.ts
import { api } from './config';

export async function getPatientCourses(patientId: string, clinicId: string) {
  return api.get(`/patients/${patientId}/courses`, { params: { clinicId } });
}

export async function getCourse(courseId: string, clinicId: string) {
  return api.get(`/treatments/courses/${courseId}`, { params: { clinicId } });
}

export async function createCourse(data: any) {
  return api.post('/treatments/courses', data);
}

export async function updateSession(sessionId: string, data: any, clinicId: string) {
  return api.put(`/treatments/sessions/${sessionId}`, data, { params: { clinicId } });
}

export async function getTemplates(clinicId: string) {
  return api.get('/treatments/templates', { params: { clinicId } });
}
```

**Step 4-6: 測試、提交**

```bash
npm run dev  # 測試前端
git add src/views/patients/ \
         src/components/patients/ \
         src/api/treatments.ts
git commit -m "feat: add treatment history tab in patient detail view"
```

---

## Phase 5: 前端 - 中央療程管理頁面

### Task 12: 建立療程管理頁面

**檔案:**
- Create: `src/views/TreatmentManagementView.vue`
- Create: `src/components/TreatmentFilterPanel.vue`
- Create: `src/components/TreatmentCardList.vue`
- Modify: `src/router/index.ts` - 添加路由

**步驟:**

1. 建立搜尋和篩選面板
2. 顯示療程卡片列表
3. 支持按患者、治療師、狀態、日期範圍篩選
4. 點擊卡片編輯或查看詳情

**前端路由:**

```typescript
// src/router/index.ts
{
  path: '/treatments/management',
  name: 'TreatmentManagement',
  component: () => import('../views/TreatmentManagementView.vue'),
  meta: { requiresAuth: true }
}
```

**Step 4-6: 測試、提交**

```bash
npm run dev
git add src/views/TreatmentManagementView.vue \
         src/components/TreatmentFilterPanel.vue \
         src/components/TreatmentCardList.vue \
         src/router/index.ts
git commit -m "feat: add central treatment management page with filtering"
```

---

## Phase 6: 整合測試和種子數據

### Task 13: 建立種子數據

**檔案:**
- Create: `src/database/seeds/treatment-course.seed.ts`
- Modify: `src/database/seeder.ts` - 添加種子運行

**種子數據示例:**

```typescript
// src/database/seeds/treatment-course.seed.ts
export async function seedTreatmentCourses() {
  const clinicId = 'clinic-001';

  // 建立模板
  const templates = [
    {
      name: '10次美容套餐',
      description: '完整的美容療程，包括基礎、進階和維護階段',
      totalSessions: 10,
      totalPrice: new Decimal('5000.00'),
      stageConfig: [
        { stageName: '基礎治療', sessionStart: 1, sessionEnd: 3 },
        { stageName: '進階治療', sessionStart: 4, sessionEnd: 7 },
        { stageName: '維護', sessionStart: 8, sessionEnd: 10 }
      ],
    },
    // ... 更多模板
  ];

  // 保存模板
  for (const tmpl of templates) {
    await templateRepository.save({
      ...tmpl,
      clinicId,
      isActive: true,
    });
  }
}
```

**Step 4-6: 測試、提交**

```bash
npm run seed
git add src/database/seeds/treatment-course.seed.ts \
         src/database/seeder.ts
git commit -m "feat: add seed data for treatment courses and templates"
```

---

## Phase 7: 完整流程整合測試

### Task 14: E2E 測試 - 完整療程工作流

**檔案:**
- Create: `tests/e2e/treatment-course.e2e.spec.ts`

**測試場景:**

```typescript
describe('Treatment Course Complete Workflow (E2E)', () => {
  it('should create course, add sessions, and complete workflow', async () => {
    // 1. 建立課程模板
    // 2. 為患者建立套餐
    // 3. 編輯第一次療程（添加時間戳、治療師、備註）
    // 4. 標記第一次療程為完成
    // 5. 驗證 PPF 計算是否正確
    // 6. 驗證患者點數是否正確扣減
    // 7. 驗證 Points 系統是否記錄了交易
  });
});
```

**Step 4-6: 測試、提交**

```bash
npm test -- tests/e2e/treatment-course.e2e.spec.ts
git add tests/e2e/treatment-course.e2e.spec.ts
git commit -m "test: add E2E tests for complete treatment course workflow"
```

---

## 執行順序總結

**後端實施** (Tasks 1-10):
1. Entities (Tasks 1-3)
2. DTOs (Task 4)
3. Services (Tasks 5-8)
4. Controller & Module (Tasks 9-10)

**前端實施** (Tasks 11-12):
5. 患者詳情頁面 (Task 11)
6. 中央管理頁面 (Task 12)

**測試與集成** (Tasks 13-14):
7. 種子數據 (Task 13)
8. E2E 測試 (Task 14)

---

## 編譯和驗證

```bash
# 編譯後端
npm run build

# 運行所有測試
npm test

# 啟動應用
npm run start
```

---

**計畫完成日期**: 2026-02-12
**預估時間**: 3-4 天（取決於並行任務數量）
**下一步**: 選擇執行方式

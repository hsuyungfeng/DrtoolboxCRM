---
phase: 01-treatment-prescription-core
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/treatments/entities/medical-order.entity.ts
  - backend/src/treatments/entities/script-template.entity.ts
  - backend/src/treatments/dto/create-medical-order.dto.ts
  - backend/src/treatments/dto/update-medical-order.dto.ts
autonomous: true
requirements: [SCRIPT-01, SCRIPT-02, SCRIPT-03]
must_haves:
  truths:
    - 醫師可創建醫令（藥物內容、劑量、使用方式）
    - 醫令追蹤使用狀態（未開始 → 進行中 → 已完成/已取消）
    - 患者可查看已開立的醫令
  artifacts:
    - path: backend/src/treatments/entities/medical-order.entity.ts
      provides: 醫令資料庫表結構
      contains: "@Entity(\"medical_orders\")" 和 status 欄位
    - path: backend/src/treatments/entities/script-template.entity.ts
      provides: 醫令模板（預設藥物/治療內容）
      contains: "@Entity(\"script_templates\")"
    - path: backend/src/treatments/dto/create-medical-order.dto.ts
      provides: 創建醫令的輸入驗證
      contains: "export class CreateMedicalOrderDto"
  key_links:
    - from: medical-order.entity.ts
      to: patient.entity.ts
      via: patientId 外鍵
      pattern: "@ManyToOne.*Patient"
    - from: medical-order.entity.ts
      to: staff.entity.ts
      via: prescribedBy 醫師ID
      pattern: "@ManyToOne.*Staff"

---

<objective>
建立醫令（Medical Order/Prescription）資料庫實體和數據轉換層，為醫令管理系統奠定基礎。

**Purpose:**
提供醫師創建和追蹤醫令所需的資料結構，支持狀態機管理（未開始 → 進行中 → 已完成）。

**Output:**
醫令 TypeORM 實體、DTO 檔案、資料庫遷移準備。
</objective>

<execution_context>
@/home/hsu/.claude/get-shit-done/workflows/execute-plan.md
@.planning/codebase/STACK.md
@.planning/codebase/ARCHITECTURE.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 現有實體參考

從 RESEARCH.md 了解到：
- TreatmentCourse 使用狀態欄位 + 時間戳（completedAt）追蹤生命週期
- Patient 實體已有 id、idNumber（唯一）、clinicId
- Staff 實體已有醫護人員資訊
- 所有實體必須包含 clinicId 以支持多租戶隔離

## 專案指南

遵循 /home/hsu/.claude/CLAUDE.md：
- 所有檔案名稱和註解使用繁體中文
- 使用 uv 管理版本（已在 package.json 中配置）
- 文件結構保持一致性

## 技術基礎

- TypeORM 0.3.28（資料庫 ORM）
- class-validator 0.14.3（DTO 驗證）
- class-transformer 0.5.1（物件轉換）
- Decimal.js 10.6.0（精確計算）
</context>

<tasks>

<task type="auto">
  <name>任務 1：建立 MedicalOrder 實體及狀態機</name>
  <files>backend/src/treatments/entities/medical-order.entity.ts</files>

  <read_first>
    - backend/src/treatments/entities/treatment-course.entity.ts
    - backend/src/treatments/entities/treatment-session.entity.ts
    - backend/src/patients/entities/patient.entity.ts
    - backend/src/staff/entities/staff.entity.ts
    - backend/src/common/audit/audit-log.entity.ts
  </read_first>

  <action>
建立 MedicalOrder 實體檔案，包含以下結構：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Patient } from '@/patients/entities/patient.entity';
import { Staff } from '@/staff/entities/staff.entity';

@Entity('medical_orders')
@Index(['clinicId', 'patientId'])
@Index(['clinicId', 'prescribedBy'])
@Index(['status'])
export class MedicalOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'uuid' })
  patientId: string;

  @Column({ type: 'uuid' })
  prescribedBy: string; // 醫師/醫護人員 ID

  // 醫令內容
  @Column({ type: 'varchar', length: 200 })
  藥物或治療名稱: string; // e.g., "阿莫西林", "物理治療"

  @Column({ type: 'text', nullable: true })
  說明: string; // 詳細說明

  @Column({ type: 'varchar', length: 100 })
  劑量: string; // e.g., "500mg x 3", "每週 2 次"

  @Column({ type: 'varchar', length: 100 })
  使用方式: string; // e.g., "口服", "肌肉注射", "每日 2 次"

  @Column({ type: 'int', default: 1 })
  療程數: number; // 總使用次數或療程數

  @Column({ type: 'int', default: 0 })
  已使用數: number; // 已完成的使用次數

  // 狀態機：pending → in_progress → completed | cancelled
  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending'
  })
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  @Column({ type: 'datetime', nullable: true })
  開始日期: Date;

  @Column({ type: 'datetime', nullable: true })
  完成日期: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 外鍵關係
  @ManyToOne(() => Patient, (patient) => patient.medicalOrders, { eager: false })
  patient: Patient;

  @ManyToOne(() => Staff, (staff) => staff.prescribedOrders, { eager: false })
  prescriber: Staff;
}
```

關鍵設計：
- 使用 uuid 主鍵與 clinicId + patientId 複合索引確保多租戶隔離和查詢效能
- status 欄位使用字符串 enum（pending → in_progress → completed/cancelled），避免額外的狀態表
- 已使用數（已使用數）字段支持療程進度追蹤（已使用數 / 療程數）
- 開始日期和完成日期時間戳記錄生命週期
- 外鍵參考 Patient 和 Staff 實體（eager: false 避免 N+1 查詢）
  </action>

  <verify>
    - [ ] 檔案存在：grep -q "@Entity('medical_orders')" backend/src/treatments/entities/medical-order.entity.ts
    - [ ] 包含 status 欄位：grep -q "status: 'pending'" backend/src/treatments/entities/medical-order.entity.ts
    - [ ] 包含複合索引：grep -q "@Index.*clinicId.*patientId" backend/src/treatments/entities/medical-order.entity.ts
    - [ ] TypeScript 編譯無誤：npx tsc --noEmit backend/src/treatments/entities/medical-order.entity.ts
  </verify>

  <done>
- MedicalOrder 實體定義完整，包含所有必要欄位（藥物、劑量、使用方式、療程數）
- 狀態機已定義（pending → in_progress → completed/cancelled）
- 複合索引已配置用於多租戶查詢
- 與 Patient 和 Staff 實體的外鍵關係已建立
  </done>
</task>

<task type="auto">
  <name>任務 2：建立 ScriptTemplate 實體</name>
  <files>backend/src/treatments/entities/script-template.entity.ts</files>

  <read_first>
    - backend/src/treatment-templates/entities/treatment-template.entity.ts
    - backend/src/treatments/entities/treatment-course-template.entity.ts
  </read_first>

  <action>
建立 ScriptTemplate 實體檔案，用於儲存預設醫令模板（常見藥物、治療方案）：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('script_templates')
@Index(['clinicId'])
export class ScriptTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'varchar', length: 200 })
  名稱: string; // e.g., "常用感冒藥", "肌肉拉傷物理治療"

  @Column({ type: 'text', nullable: true })
  說明: string;

  @Column({ type: 'varchar', length: 100 })
  預設劑量: string; // e.g., "500mg x 3"

  @Column({ type: 'varchar', length: 100 })
  預設使用方式: string; // e.g., "口服"

  @Column({ type: 'int', default: 1 })
  預設療程數: number;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  狀態: 'active' | 'inactive';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

用途：醫師快速選擇常用醫令模板，預填劑量和使用方式，減少重複輸入。
  </action>

  <verify>
    - [ ] 檔案存在：grep -q "@Entity('script_templates')" backend/src/treatments/entities/script-template.entity.ts
    - [ ] 包含名稱欄位：grep -q "名稱: string" backend/src/treatments/entities/script-template.entity.ts
    - [ ] TypeScript 編譯無誤：npx tsc --noEmit backend/src/treatments/entities/script-template.entity.ts
  </verify>

  <done>
- ScriptTemplate 實體定義完整，支持醫令範本管理
- 包含 clinicId 索引以確保診所隔離
- 狀態欄位支持啟用/停用範本
  </done>
</task>

<task type="auto">
  <name>任務 3：建立 CreateMedicalOrderDto 和 UpdateMedicalOrderDto</name>
  <files>
    - backend/src/treatments/dto/create-medical-order.dto.ts
    - backend/src/treatments/dto/update-medical-order.dto.ts
  </files>

  <read_first>
    - backend/src/treatments/dto/create-treatment-course.dto.ts
    - backend/src/patients/entities/patient.entity.ts
  </read_first>

  <action>
建立 DTO 檔案用於請求驗證：

**create-medical-order.dto.ts:**

```typescript
import { IsString, IsUUID, IsInt, Min, IsOptional, MaxLength } from 'class-validator';

export class CreateMedicalOrderDto {
  @IsUUID()
  patientId: string;

  @IsString()
  @MaxLength(200)
  藥物或治療名稱: string;

  @IsOptional()
  @IsString()
  說明?: string;

  @IsString()
  @MaxLength(100)
  劑量: string;

  @IsString()
  @MaxLength(100)
  使用方式: string;

  @IsInt()
  @Min(1)
  療程數: number;

  @IsOptional()
  @IsString()
  scriptTemplateId?: string; // 可選：從範本複製
}
```

**update-medical-order.dto.ts:**

```typescript
import { IsString, IsInt, Min, IsOptional, MaxLength } from 'class-validator';

export class UpdateMedicalOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  藥物或治療名稱?: string;

  @IsOptional()
  @IsString()
  說明?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  劑量?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  使用方式?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  療程數?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  已使用數?: number; // 更新已使用次數

  @IsOptional()
  @IsString()
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}
```

設計原則：
- 使用 class-validator 確保請求數據的型別和值範圍正確
- patientId 必須是有效的 UUID
- 可選欄位使用 @IsOptional() 允許部分更新
- scriptTemplateId 允許從範本快速建立醫令
  </action>

  <verify>
    - [ ] CreateMedicalOrderDto 存在：grep -q "export class CreateMedicalOrderDto" backend/src/treatments/dto/create-medical-order.dto.ts
    - [ ] UpdateMedicalOrderDto 存在：grep -q "export class UpdateMedicalOrderDto" backend/src/treatments/dto/update-medical-order.dto.ts
    - [ ] 包含 class-validator 裝飾器：grep -q "@IsUUID()" backend/src/treatments/dto/create-medical-order.dto.ts
    - [ ] TypeScript 編譯無誤
  </verify>

  <done>
- CreateMedicalOrderDto 定義完整，包含必要驗證
- UpdateMedicalOrderDto 定義完整，支持部分更新
- 兩個 DTO 都正確使用 class-validator 裝飾器
  </done>
</task>

</tasks>

<verification>
**Entity 驗證：**
- 所有 DTO 類都可正確編譯
- MedicalOrder 和 ScriptTemplate 實體都遵循 TypeORM 模式
- 索引和外鍵關係正確配置

**業務邏輯驗證：**
- status 欄位支持有效的狀態轉換（pending → in_progress → completed/cancelled）
- 已使用數欄位支持療程進度追蹤計算
- 複合索引確保多租戶隔離查詢效能
</verification>

<success_criteria>
- [ ] MedicalOrder 實體包含所有必要欄位（藥物、劑量、使用方式、狀態、時間戳）
- [ ] ScriptTemplate 實體用於儲存可復用的醫令模板
- [ ] DTO 檔案完整且驗證規則正確
- [ ] 所有 TypeScript 檔案編譯無誤
- [ ] 實體遵循 DDD 架構模式（clinicId、外鍵、索引）
</success_criteria>

<output>
完成後請建立文件：
`.planning/phases/01-treatment-prescription-core/01-SUMMARY.md`

紀錄：
- 建立的實體：MedicalOrder、ScriptTemplate
- 建立的 DTO：CreateMedicalOrderDto、UpdateMedicalOrderDto
- 狀態機定義：pending → in_progress → completed/cancelled
- 多租戶支持：clinicId 索引和外鍵關係
</output>


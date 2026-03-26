---
phase: 01-treatment-prescription-core
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/patients/entities/patient.entity.ts
  - backend/src/patients/services/patient-search.service.ts
  - backend/src/patients/repositories/patient-search.repository.ts
autonomous: true
requirements: [PATIENT-01, PATIENT-02, PATIENT-03]
must_haves:
  truths:
    - 系統能以身份證ID + 姓名唯一識別患者
    - 系統能保存患者基本資料（聯絡方式、病史、過敏史）
    - 患者資料支持快速搜尋與篩選
  artifacts:
    - path: backend/src/patients/entities/patient.entity.ts
      provides: 患者資料庫表結構和複合索引
      contains: "@Index.*clinicId.*idNumber"
    - path: backend/src/patients/services/patient-search.service.ts
      provides: 高效患者搜尋服務
      contains: "findByIdNumberAndName"
    - path: backend/src/patients/repositories/patient-search.repository.ts
      provides: 患者查詢倉庫
      contains: "queryByIdNumber"
  key_links:
    - from: patient.entity.ts
      to: treatment-course.entity.ts
      via: 一對多患者療程關係
      pattern: "@OneToMany.*TreatmentCourse"
    - from: patient-search.service.ts
      to: patient.entity.ts
      via: 查詢患者紀錄
      pattern: "repository.find"

---

<objective>
實現患者身份識別、資料管理和高效搜尋功能，支持按身份證ID + 姓名的複合索引查詢。

**Purpose:**
患者資料是醫療系統的基礎，需要唯一識別、完整保存、快速搜尋。確保診所隔離和查詢性能。

**Output:**
增強的 Patient 實體、PatientSearchService（高效搜尋）、PatientSearchRepository（複合索引查詢）。
</objective>

<execution_context>
@/home/hsu/.claude/get-shit-done/workflows/execute-plan.md
@.planning/codebase/STACK.md
@.planning/codebase/ARCHITECTURE.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 現有 Patient 實體

根據 ARCHITECTURE.md 和 RESEARCH.md：
- Patient 實體已存在於 backend/src/patients/entities/patient.entity.ts
- 已有 idNumber（身份證ID）欄位
- 需要驗證是否有複合索引 (clinicId, idNumber)
- 需要確保包含聯絡方式、病史、過敏史欄位

## 搜尋優化策略

從 RESEARCH.md Pattern 2：
```typescript
@Index(["clinicId", "idNumber"]) // Composite index for fast clinic+patient queries
```

使用複合索引支持：
- 按診所 + 身份證ID 查詢（最快）
- 按診所 + 身份證ID + 姓名 查詢（帶名字驗證）
- 按診所 + 姓名模糊搜尋（配合全文索引）

## 資料驗證

- 身份證ID 必須唯一（在診所內）
- 聯絡方式（電話、信箱）需驗證格式
- 過敏史應記錄為文本欄位
- 病史應支持多個診斷紀錄
</context>

<tasks>

<task type="auto">
  <name>任務 1：增強 Patient 實體的複合索引和欄位</name>
  <files>backend/src/patients/entities/patient.entity.ts</files>

  <read_first>
    - backend/src/patients/entities/patient.entity.ts
    - backend/src/treatments/entities/treatment-course.entity.ts
  </read_first>

  <action>
確保 Patient 實體包含以下結構和索引：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany, Check } from 'typeorm';
import { TreatmentCourse } from '@/treatments/entities/treatment-course.entity';

@Entity('patients')
@Index(['clinicId', 'idNumber'], { unique: true }) // 複合唯一索引：診所內身份證ID唯一
@Index(['clinicId', 'name']) // 複合索引：按診所 + 姓名搜尋
@Index(['clinicId']) // 單一索引：按診所過濾
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  // 基本身份識別
  @Column({ type: 'varchar', length: 50 })
  idNumber: string; // 身份證號碼/護照號/員工ID（取決於地區）

  @Column({ type: 'varchar', length: 100 })
  name: string; // 患者姓名

  @Column({ type: 'varchar', length: 50, nullable: true })
  gender: 'male' | 'female' | 'other'; // 性別

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date; // 出生日期

  // 聯絡資訊
  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string; // 電話號碼

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string; // 信箱

  @Column({ type: 'varchar', length: 200, nullable: true })
  address: string; // 住址

  // 醫療背景
  @Column({ type: 'text', nullable: true })
  medicalHistory: string; // 病史（多行文本）

  @Column({ type: 'text', nullable: true })
  allergies: string; // 過敏史（多行文本）

  @Column({ type: 'text', nullable: true })
  notes: string; // 醫護備註

  // 狀態管理
  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: 'active' | 'inactive' | 'blocked';

  // 時間戳
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 關係
  @OneToMany(() => TreatmentCourse, (course) => course.patient, { eager: false })
  treatmentCourses: TreatmentCourse[];
}
```

關鍵設計：
- (clinicId, idNumber) 複合唯一索引：確保診所內身份證ID唯一，支持快速識別
- (clinicId, name) 複合索引：支持按診所 + 名字搜尋
- 聯絡資訊欄位（電話、信箱、住址）
- 醫療背景欄位（病史、過敏史、醫護備註）
- 狀態欄位支持停用患者（不刪除）
  </action>

  <verify>
    - [ ] 複合唯一索引存在：grep -q "@Index.*clinicId.*idNumber.*unique: true" backend/src/patients/entities/patient.entity.ts
    - [ ] 複合索引存在：grep -q "@Index.*clinicId.*name" backend/src/patients/entities/patient.entity.ts
    - [ ] 包含聯絡資訊欄位：grep -q "phoneNumber\|email\|address" backend/src/patients/entities/patient.entity.ts
    - [ ] 包含醫療背景欄位：grep -q "medicalHistory\|allergies" backend/src/patients/entities/patient.entity.ts
    - [ ] TypeScript 編譯無誤：npx tsc --noEmit backend/src/patients/entities/patient.entity.ts
  </verify>

  <done>
- Patient 實體已更新，包含完整的身份識別和聯絡資訊欄位
- 複合唯一索引確保診所內身份證ID唯一
- 複合查詢索引支持高效搜尋
  </done>
</task>

<task type="auto">
  <name>任務 2：建立 PatientSearchRepository</name>
  <files>backend/src/patients/repositories/patient-search.repository.ts</files>

  <read_first>
    - backend/src/patients/entities/patient.entity.ts
  </read_first>

  <action>
建立 PatientSearchRepository 用於複雜查詢：

```typescript
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Patient } from '@/patients/entities/patient.entity';

@Injectable()
export class PatientSearchRepository extends Repository<Patient> {
  constructor(private readonly dataSource: DataSource) {
    super(Patient, dataSource.createEntityManager());
  }

  /**
   * 按身份證ID和診所查詢患者（精確查詢）
   */
  async findByIdNumberAndClinic(
    idNumber: string,
    clinicId: string,
  ): Promise<Patient | null> {
    return this.findOne({
      where: { idNumber, clinicId, status: 'active' },
      relations: ['treatmentCourses'],
    });
  }

  /**
   * 按身份證ID、姓名和診所查詢（驗證身份）
   */
  async findByIdNumberNameAndClinic(
    idNumber: string,
    name: string,
    clinicId: string,
  ): Promise<Patient | null> {
    return this.findOne({
      where: { idNumber, name, clinicId, status: 'active' },
      relations: ['treatmentCourses'],
    });
  }

  /**
   * 按姓名模糊搜尋（診所內）
   */
  async searchByName(
    name: string,
    clinicId: string,
    limit: number = 20,
  ): Promise<Patient[]> {
    return this.createQueryBuilder('p')
      .where('p.clinicId = :clinicId', { clinicId })
      .andWhere('p.status = :status', { status: 'active' })
      .andWhere('p.name LIKE :name', { name: `%${name}%` })
      .orderBy('p.name', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * 按身份證ID模糊搜尋
   */
  async searchByIdNumber(
    idNumber: string,
    clinicId: string,
    limit: number = 20,
  ): Promise<Patient[]> {
    return this.createQueryBuilder('p')
      .where('p.clinicId = :clinicId', { clinicId })
      .andWhere('p.status = :status', { status: 'active' })
      .andWhere('p.idNumber LIKE :idNumber', { idNumber: `%${idNumber}%` })
      .orderBy('p.idNumber', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * 綜合搜尋（身份證ID 或 姓名）
   */
  async searchPatients(
    keyword: string,
    clinicId: string,
    limit: number = 20,
  ): Promise<Patient[]> {
    return this.createQueryBuilder('p')
      .where('p.clinicId = :clinicId', { clinicId })
      .andWhere('p.status = :status', { status: 'active' })
      .andWhere('(p.idNumber LIKE :keyword OR p.name LIKE :keyword)', {
        keyword: `%${keyword}%`,
      })
      .orderBy('p.name', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * 取得診所所有患者（分頁）
   */
  async findByClinic(
    clinicId: string,
    skip: number = 0,
    take: number = 20,
  ): Promise<[Patient[], number]> {
    return this.findAndCount({
      where: { clinicId, status: 'active' },
      order: { name: 'ASC' },
      skip,
      take,
    });
  }

  /**
   * 檢查身份證ID是否已存在（在診所內）
   */
  async existsByIdNumber(idNumber: string, clinicId: string): Promise<boolean> {
    const count = await this.count({
      where: { idNumber, clinicId, status: 'active' },
    });
    return count > 0;
  }

  /**
   * 取得患者的治療紀錄
   */
  async getPatientWithTreatments(
    patientId: string,
    clinicId: string,
  ): Promise<Patient | null> {
    return this.findOne({
      where: { id: patientId, clinicId },
      relations: ['treatmentCourses', 'treatmentCourses.sessions'],
    });
  }
}
```

設計：
- 使用資料庫級別的索引查詢，避免應用層過濾
- 支持精確查詢（身份證ID）和模糊搜尋（姓名）
- 所有查詢都過濾 clinicId 確保多租戶隔離
- 支持分頁以提高大量患者時的性能
- existsByIdNumber 用於重複檢查（建立新患者時）
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/patients/repositories/patient-search.repository.ts
    - [ ] 包含 findByIdNumberAndClinic 方法：grep -q "async findByIdNumberAndClinic" backend/src/patients/repositories/patient-search.repository.ts
    - [ ] 包含 searchByName 方法：grep -q "async searchByName" backend/src/patients/repositories/patient-search.repository.ts
    - [ ] 包含 searchPatients 綜合搜尋：grep -q "async searchPatients" backend/src/patients/repositories/patient-search.repository.ts
    - [ ] TypeScript 編譯無誤
  </verify>

  <done>
- PatientSearchRepository 實作完整
- 支持精確和模糊搜尋
- 所有查詢都考慮 clinicId 隔離
  </done>
</task>

<task type="auto">
  <name>任務 3：建立 PatientSearchService</name>
  <files>backend/src/patients/services/patient-search.service.ts</files>

  <read_first>
    - backend/src/patients/repositories/patient-search.repository.ts
    - backend/src/patients/entities/patient.entity.ts
  </read_first>

  <action>
建立 PatientSearchService 提供高階業務邏輯：

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PatientSearchRepository } from '@/patients/repositories/patient-search.repository';
import { Patient } from '@/patients/entities/patient.entity';

@Injectable()
export class PatientSearchService {
  constructor(private readonly patientRepository: PatientSearchRepository) {}

  /**
   * 按身份證ID標識患者（主要識別方式）
   */
  async identifyPatientByIdNumber(
    idNumber: string,
    clinicId: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findByIdNumberAndClinic(
      idNumber,
      clinicId,
    );

    if (!patient) {
      throw new NotFoundException(
        `身份證ID ${idNumber} 在診所 ${clinicId} 中不存在`,
      );
    }

    return patient;
  }

  /**
   * 雙重驗證：身份證ID + 姓名
   * 用於高安全性場景（患者自助查詢）
   */
  async identifyPatientByIdAndName(
    idNumber: string,
    name: string,
    clinicId: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findByIdNumberNameAndClinic(
      idNumber,
      name,
      clinicId,
    );

    if (!patient) {
      throw new NotFoundException('身份證ID 或 姓名不匹配');
    }

    return patient;
  }

  /**
   * 搜尋患者（可用於自動完成或患者列表）
   */
  async searchPatients(
    keyword: string,
    clinicId: string,
    limit: number = 20,
  ): Promise<Patient[]> {
    if (!keyword || keyword.trim().length === 0) {
      throw new BadRequestException('搜尋關鍵字不能為空');
    }

    if (keyword.length > 100) {
      throw new BadRequestException('搜尋關鍵字過長');
    }

    return this.patientRepository.searchPatients(
      keyword.trim(),
      clinicId,
      limit,
    );
  }

  /**
   * 取得診所患者列表（含分頁）
   */
  async getClinicPatients(
    clinicId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ data: Patient[]; total: number; page: number; pageSize: number }> {
    const skip = (page - 1) * pageSize;
    const [patients, total] = await this.patientRepository.findByClinic(
      clinicId,
      skip,
      pageSize,
    );

    return {
      data: patients,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 驗證身份證ID是否可用（建立新患者時）
   */
  async validateIdNumberAvailability(
    idNumber: string,
    clinicId: string,
  ): Promise<boolean> {
    const exists = await this.patientRepository.existsByIdNumber(
      idNumber,
      clinicId,
    );
    return !exists; // 返回 true 表示可用
  }

  /**
   * 取得患者含治療紀錄
   */
  async getPatientProfile(
    patientId: string,
    clinicId: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.getPatientWithTreatments(
      patientId,
      clinicId,
    );

    if (!patient) {
      throw new NotFoundException('患者不存在');
    }

    return patient;
  }

  /**
   * 取得患者基本資訊（隱藏敏感欄位）
   */
  getPublicPatientInfo(patient: Patient): any {
    return {
      id: patient.id,
      name: patient.name,
      idNumber: patient.idNumber, // 可根據安全政策決定是否隱藏
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      phoneNumber: patient.phoneNumber,
      email: patient.email,
      status: patient.status,
    };
  }
}
```

設計：
- identifyPatientByIdNumber：主要識別方式，使用複合唯一索引
- identifyPatientByIdAndName：雙重驗證，提高安全性
- searchPatients：關鍵字搜尋，用於 UI 自動完成
- validateIdNumberAvailability：建立患者時驗證身份證ID唯一性
- getPublicPatientInfo：返回公開資訊，隱藏敏感欄位
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/patients/services/patient-search.service.ts
    - [ ] 包含 identifyPatientByIdNumber 方法：grep -q "async identifyPatientByIdNumber" backend/src/patients/services/patient-search.service.ts
    - [ ] 包含 searchPatients 方法：grep -q "async searchPatients" backend/src/patients/services/patient-search.service.ts
    - [ ] 包含 validateIdNumberAvailability 方法：grep -q "async validateIdNumberAvailability" backend/src/patients/services/patient-search.service.ts
    - [ ] TypeScript 編譯無誤
  </verify>

  <done>
- PatientSearchService 實作完整
- 支持身份證ID識別、雙重驗證、搜尋、驗證唯一性
- 包含公開資訊返回方法，隱藏敏感欄位
  </done>
</task>

</tasks>

<verification>
**身份識別驗證：**
- 複合唯一索引 (clinicId, idNumber) 確保患者在診所內唯一
- 可以按身份證ID精確識別患者
- 支持身份證ID + 姓名雙重驗證

**搜尋性能驗證：**
- 複合索引支持高效 (clinicId, name) 和 (clinicId, idNumber) 查詢
- 分頁查詢支持大量患者列表
- 模糊搜尋使用 LIKE 查詢配合索引

**多租戶隔離驗證：**
- 所有查詢都過濾 clinicId
- 複合唯一索引包含 clinicId 確保隔離
</verification>

<success_criteria>
- [ ] Patient 實體包含完整的身份識別欄位（idNumber、name）和聯絡資訊
- [ ] 複合唯一索引 (clinicId, idNumber) 已配置
- [ ] PatientSearchRepository 支持精確和模糊搜尋
- [ ] PatientSearchService 提供業務邏輯層
- [ ] 所有查詢都確保 clinicId 隔離
- [ ] 支持患者識別、搜尋、驗證唯一性
</success_criteria>

<output>
完成後請建立文件：
`.planning/phases/01-treatment-prescription-core/03-SUMMARY.md`

紀錄：
- 增強的實體：Patient（複合唯一索引 + 聯絡資訊）
- 建立的倉庫：PatientSearchRepository（精確和模糊查詢）
- 建立的服務：PatientSearchService（業務邏輯）
- 搜尋方式：身份證ID、姓名、綜合關鍵字搜尋
</output>


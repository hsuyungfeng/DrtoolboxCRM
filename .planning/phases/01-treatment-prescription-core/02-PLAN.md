---
phase: 01-treatment-prescription-core
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/treatments/entities/treatment-course.entity.ts
  - backend/src/treatments/services/treatment-course.service.ts
  - backend/src/treatments/services/treatment-progress.service.ts
autonomous: true
requirements: [COURSE-03, COURSE-04]
must_haves:
  truths:
    - 系統能計算療程進度（已完成課程數/總課程數）
    - 系統能分配醫護人員到療程課程
    - 療程進度變化可即時反映
  artifacts:
    - path: backend/src/treatments/services/treatment-progress.service.ts
      provides: 療程進度計算邏輯
      contains: "getProgressPercent"
    - path: backend/src/treatments/services/treatment-course.service.ts
      provides: 療程管理業務邏輯
      contains: "assignStaffToSession"
  key_links:
    - from: treatment-course.service.ts
      to: treatment-session.service.ts
      via: 建立和追蹤課程
      pattern: "sessions.*map"
    - from: treatment-progress.service.ts
      to: treatment-session.entity.ts
      via: 計算進度百分比
      pattern: "completionStatus.*completed"

---

<objective>
實現療程進度計算和醫護人員分配功能，為療程生命週期管理奠定基礎。

**Purpose:**
患者和醫護人員需要實時看到療程進度，並且系統需要支持醫護人員分配到具體課程。

**Output:**
TreatmentProgressService（計算進度）和增強的 TreatmentCourseService（支持醫護分配）。
</objective>

<execution_context>
@/home/hsu/.claude/get-shit-done/workflows/execute-plan.md
@.planning/codebase/STACK.md
@.planning/codebase/ARCHITECTURE.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 現有實體

根據 RESEARCH.md：
- TreatmentCourse 已有 sessions 一對多關係
- TreatmentSession 已有 completionStatus 欄位
- StaffAssignment 實體已存在（需驗證）
- 進度應由 sessions 完成狀態計算，不單獨儲存

## 技術參考

Pattern 1 from RESEARCH.md：
```typescript
// Service calculates progress
export class TreatmentCourseService {
  getProgressPercent(course: TreatmentCourse): number {
    const completed = course.sessions.filter(
      (s) => s.completionStatus === "completed"
    ).length;
    return (completed / course.sessions.length) * 100;
  }
}
```

## 設計原則

- 進度計算必須即時從 sessions 衍生，不儲存額外進度欄位
- 分配醫護人員到課程時，需驗證醫護人員存在且有效
- 支持一對多：一個課程可分配多個醫護人員到不同課程
</context>

<tasks>

<task type="auto">
  <name>任務 1：建立 TreatmentProgressService</name>
  <files>backend/src/treatments/services/treatment-progress.service.ts</files>

  <read_first>
    - backend/src/treatments/entities/treatment-course.entity.ts
    - backend/src/treatments/entities/treatment-session.entity.ts
    - backend/src/treatments/services/treatment-session.service.ts
  </read_first>

  <action>
建立 TreatmentProgressService，負責計算和報告療程進度：

```typescript
import { Injectable } from '@nestjs/common';
import { TreatmentCourse } from '@/treatments/entities/treatment-course.entity';
import { TreatmentSession } from '@/treatments/entities/treatment-session.entity';

@Injectable()
export class TreatmentProgressService {
  /**
   * 計算療程進度百分比
   * @param course 療程，包含 sessions 關係
   * @returns 0-100 的百分比
   */
  calculateProgressPercent(course: TreatmentCourse): number {
    if (!course.sessions || course.sessions.length === 0) {
      return 0;
    }

    const completedCount = course.sessions.filter(
      (session) => session.completionStatus === 'completed'
    ).length;

    return Math.round((completedCount / course.sessions.length) * 100);
  }

  /**
   * 取得療程進度物件
   */
  getProgress(course: TreatmentCourse) {
    const completedCount = course.sessions?.filter(
      (s) => s.completionStatus === 'completed'
    ).length || 0;
    const totalCount = course.sessions?.length || 0;

    return {
      totalSessions: totalCount,
      completedSessions: completedCount,
      pendingSessions: totalCount - completedCount,
      progressPercent: this.calculateProgressPercent(course),
      isCompleted: totalCount > 0 && completedCount === totalCount,
    };
  }

  /**
   * 確定療程是否已全部完成
   */
  isCourseFinallyCompleted(course: TreatmentCourse): boolean {
    if (!course.sessions || course.sessions.length === 0) {
      return false;
    }
    return course.sessions.every((s) => s.completionStatus === 'completed');
  }

  /**
   * 批量計算多個療程進度
   */
  calculateProgressForCourses(courses: TreatmentCourse[]) {
    return courses.map((course) => ({
      courseId: course.id,
      progress: this.getProgress(course),
    }));
  }
}
```

設計：
- calculateProgressPercent：簡單計算百分比，用於內部函式
- getProgress：返回完整進度物件（已完成數、待完成數、百分比等）
- isCourseFinallyCompleted：檢查療程是否全部完成（用於狀態轉換）
- calculateProgressForCourses：批量計算效率（避免 N+1 查詢）
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/treatments/services/treatment-progress.service.ts
    - [ ] 包含 calculateProgressPercent 方法：grep -q "calculateProgressPercent" backend/src/treatments/services/treatment-progress.service.ts
    - [ ] 包含 getProgress 方法：grep -q "getProgress" backend/src/treatments/services/treatment-progress.service.ts
    - [ ] TypeScript 編譯無誤：npx tsc --noEmit backend/src/treatments/services/treatment-progress.service.ts
  </verify>

  <done>
- TreatmentProgressService 實作完整
- 包含即時進度計算邏輯（百分比、已完成數、待完成數）
- 支持批量計算優化性能
  </done>
</task>

<task type="auto">
  <name>任務 2：在 TreatmentCourseService 中添加醫護人員分配方法</name>
  <files>backend/src/treatments/services/treatment-course.service.ts</files>

  <read_first>
    - backend/src/treatments/services/treatment-course.service.ts
    - backend/src/treatments/entities/staff-assignment.entity.ts
    - backend/src/staff/entities/staff.entity.ts
    - backend/src/treatments/entities/treatment-session.entity.ts
  </read_first>

  <action>
在現有 TreatmentCourseService 中添加醫護人員分配功能：

```typescript
// 在 TreatmentCourseService 建構式中注入必要的依賴
export class TreatmentCourseService {
  constructor(
    @InjectRepository(TreatmentCourse)
    private courseRepository: Repository<TreatmentCourse>,
    @InjectRepository(TreatmentSession)
    private sessionRepository: Repository<TreatmentSession>,
    @InjectRepository(StaffAssignment)
    private staffAssignmentRepository: Repository<StaffAssignment>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    private treatmentProgressService: TreatmentProgressService,
    // ... existing dependencies
  ) {}

  /**
   * 分配醫護人員到療程課程
   * @param courseId 療程 ID
   * @param sessionId 課程 ID（不提供時分配到整個療程所有待分配課程）
   * @param staffId 醫護人員 ID
   * @param clinicId 診所 ID
   */
  async assignStaffToSession(
    courseId: string,
    sessionId: string,
    staffId: string,
    clinicId: string,
  ): Promise<StaffAssignment> {
    // 驗證療程存在且屬於該診所
    const course = await this.courseRepository.findOne({
      where: { id: courseId, clinicId },
    });
    if (!course) {
      throw new NotFoundException('療程不存在');
    }

    // 驗證課程存在且屬於該療程
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, treatmentCourseId: courseId },
    });
    if (!session) {
      throw new NotFoundException('課程不存在');
    }

    // 驗證醫護人員存在且屬於該診所
    const staff = await this.staffRepository.findOne({
      where: { id: staffId, clinicId },
    });
    if (!staff) {
      throw new NotFoundException('醫護人員不存在');
    }

    // 檢查是否已分配
    const existing = await this.staffAssignmentRepository.findOne({
      where: { sessionId, staffId },
    });
    if (existing) {
      throw new BadRequestException('該醫護人員已分配到此課程');
    }

    // 建立分配記錄
    const assignment = this.staffAssignmentRepository.create({
      sessionId,
      staffId,
      courseId,
      clinicId,
      assignedAt: new Date(),
    });

    return this.staffAssignmentRepository.save(assignment);
  }

  /**
   * 取得療程的醫護人員分配情況
   */
  async getStaffAssignmentsForCourse(
    courseId: string,
    clinicId: string,
  ): Promise<StaffAssignment[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId, clinicId },
      relations: ['sessions'],
    });

    if (!course) {
      throw new NotFoundException('療程不存在');
    }

    const sessionIds = course.sessions.map((s) => s.id);

    return this.staffAssignmentRepository.find({
      where: { sessionId: sessionIds },
      relations: ['staff', 'session'],
    });
  }

  /**
   * 取消醫護人員分配
   */
  async unassignStaff(
    assignmentId: string,
    clinicId: string,
  ): Promise<void> {
    const assignment = await this.staffAssignmentRepository.findOne({
      where: { id: assignmentId, clinicId },
    });

    if (!assignment) {
      throw new NotFoundException('分配記錄不存在');
    }

    await this.staffAssignmentRepository.remove(assignment);
  }
}
```

設計原則：
- assignStaffToSession：驗證所有實體存在、屬於診所、且尚未分配
- getStaffAssignmentsForCourse：返回療程所有課程的醫護人員分配
- unassignStaff：支持取消分配
- 使用 NotFoundException 和 BadRequestException 提供清晰的錯誤訊息
  </action>

  <verify>
    - [ ] assignStaffToSession 方法存在：grep -q "async assignStaffToSession" backend/src/treatments/services/treatment-course.service.ts
    - [ ] getStaffAssignmentsForCourse 方法存在：grep -q "async getStaffAssignmentsForCourse" backend/src/treatments/services/treatment-course.service.ts
    - [ ] unassignStaff 方法存在：grep -q "async unassignStaff" backend/src/treatments/services/treatment-course.service.ts
    - [ ] 依賴注入包含 TreatmentProgressService：grep -q "treatmentProgressService" backend/src/treatments/services/treatment-course.service.ts
  </verify>

  <done>
- TreatmentCourseService 已擴展，支持醫護人員分配
- 包含驗證邏輯確保資料一致性
- 支持分配查詢和取消分配操作
  </done>
</task>

<task type="auto">
  <name>任務 3：更新 TreatmentCourseService 整合進度計算</name>
  <files>backend/src/treatments/services/treatment-course.service.ts</files>

  <read_first>
    - backend/src/treatments/services/treatment-course.service.ts
    - backend/src/treatments/services/treatment-progress.service.ts
  </read_first>

  <action>
在 TreatmentCourseService 的查詢方法中整合進度計算：

```typescript
/**
 * 取得療程含進度資訊
 */
async getCourseWithProgress(
  courseId: string,
  clinicId: string,
): Promise<TreatmentCourse & { progress: any }> {
  const course = await this.courseRepository.findOne({
    where: { id: courseId, clinicId },
    relations: ['sessions'],
  });

  if (!course) {
    throw new NotFoundException('療程不存在');
  }

  const progress = this.treatmentProgressService.getProgress(course);

  return {
    ...course,
    progress,
  };
}

/**
 * 列舉患者的所有療程含進度
 */
async getPatientCoursesWithProgress(
  patientId: string,
  clinicId: string,
): Promise<Array<TreatmentCourse & { progress: any }>> {
  const courses = await this.courseRepository.find({
    where: { patientId, clinicId },
    relations: ['sessions'],
  });

  return courses.map((course) => ({
    ...course,
    progress: this.treatmentProgressService.getProgress(course),
  }));
}

/**
 * 更新課程完成狀態，自動更新療程狀態
 */
async completeSession(
  sessionId: string,
  clinicId: string,
): Promise<TreatmentSession> {
  const session = await this.sessionRepository.findOne({
    where: { id: sessionId },
    relations: ['treatmentCourse'],
  });

  if (!session) {
    throw new NotFoundException('課程不存在');
  }

  // 更新課程狀態
  session.completionStatus = 'completed';
  session.completedAt = new Date();
  await this.sessionRepository.save(session);

  // 檢查療程是否全部完成
  const course = await this.courseRepository.findOne({
    where: { id: session.treatmentCourseId },
    relations: ['sessions'],
  });

  const isFinally = this.treatmentProgressService.isCourseFinallyCompleted(course);

  if (isFinally && course.status !== 'completed') {
    course.status = 'completed';
    course.completedAt = new Date();
    await this.courseRepository.save(course);
  }

  return session;
}
```

整合策略：
- 所有返回療程的查詢方法都計算並附加進度資訊
- completeSession 當所有課程完成時自動轉換療程狀態為 completed
- 使用 TreatmentProgressService 檢查療程是否終結完成
  </action>

  <verify>
    - [ ] getCourseWithProgress 方法存在：grep -q "async getCourseWithProgress" backend/src/treatments/services/treatment-course.service.ts
    - [ ] getPatientCoursesWithProgress 方法存在：grep -q "async getPatientCoursesWithProgress" backend/src/treatments/services/treatment-course.service.ts
    - [ ] completeSession 方法包含自動狀態轉換：grep -q "isFinally.*completed" backend/src/treatments/services/treatment-course.service.ts
  </verify>

  <done>
- TreatmentCourseService 整合進度計算
- 查詢方法都返回進度資訊
- 課程完成時自動更新療程狀態
  </done>
</task>

</tasks>

<verification>
**業務邏輯驗證：**
- TreatmentProgressService 正確計算百分比（已完成數/總數）
- 進度計算即時反映 sessions 狀態變化
- 醫護人員分配驗證所有實體存在和權限
- 療程狀態自動轉換（當所有課程完成時）

**資料一致性驗證：**
- 分配記錄包含所有必要欄位（sessionId、staffId、clinicId）
- 進度物件結構一致（totalSessions、completedSessions、progressPercent）
</verification>

<success_criteria>
- [ ] TreatmentProgressService 實作完整
- [ ] 進度計算公式正確（已完成課程數 / 總課程數）
- [ ] TreatmentCourseService 支持醫護人員分配和取消分配
- [ ] 療程完成時自動更新狀態
- [ ] 所有查詢方法返回進度資訊
</success_criteria>

<output>
完成後請建立文件：
`.planning/phases/01-treatment-prescription-core/02-SUMMARY.md`

紀錄：
- 建立的服務：TreatmentProgressService
- 增強的服務：TreatmentCourseService（分配、進度計算）
- 進度計算公式：completedSessions / totalSessions * 100
- 自動狀態轉換邏輯已實現
</output>


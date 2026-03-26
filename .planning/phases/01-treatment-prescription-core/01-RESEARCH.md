# Phase 1: Treatment & Prescription Core - Research

**Researched:** 2026-03-26
**Domain:** Treatment & Medical Order (Script) Lifecycle Management + Patient Identification
**Confidence:** HIGH

## Summary

Phase 1 implements the foundational treatment course management (療程) and medical order (醫令/處方) systems for a self-pay medical clinic CRM. The current codebase has a solid foundation for TreatmentCourse, TreatmentSession, and multi-tenant architecture. Phase 1 must build out:

1. **Complete Treatment Lifecycle:** Create → Track Progress → Complete (COURSE-01 to COURSE-05)
2. **Medical Order (Script) System:** Create new entity/service for medical prescriptions (SCRIPT-01 to SCRIPT-03) — currently missing from codebase
3. **Patient Identification & Querying:** Multi-clinic patient lookup by idNumber + name with fast search (PATIENT-01 to PATIENT-03)
4. **Staff Assignment to Sessions:** Healthcare provider assignment patterns (COURSE-04)
5. **Test Coverage:** Achieve 90% coverage with integration tests for all entities and patient query patterns

**Primary recommendation:** Extend existing TreatmentCourse/TreatmentSession architecture to add medical orders as a separate feature module. Implement ScriptTemplate + MedicalOrder entities with status tracking. Patient queries must support indexed idNumber+name lookup for performance.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COURSE-01 | 醫護人員能創建新療程（名稱、類型、費用、療程數） | TreatmentCourse entity exists; needs template creation UI |
| COURSE-02 | 醫護人員能編輯療程詳情（目標、描述、進度等） | Service methods exist for updateCourseStatus; extend for field editing |
| COURSE-03 | 系統能追蹤療程進度（已完成課程數/總課程數） | TreatmentSession tracks completionStatus; compute progress on read |
| COURSE-04 | 系統能分配醫護人員到療程課程 | StaffAssignment entity exists; needs UI controllers |
| COURSE-05 | 患者能查看自己的療程列表與進度 | API exists; needs patient-facing endpoint with proper auth |
| SCRIPT-01 | 醫師能創建醫令（藥物/治療內容、劑量、使用方式） | **MISSING** — need to create MedicalOrder/Prescription entity |
| SCRIPT-02 | 系統能追蹤醫令使用狀態（未開始、進行中、已完成） | **MISSING** — need MedicalOrder status state machine |
| SCRIPT-03 | 患者能查看已開立的醫令與使用進度 | **MISSING** — need patient API endpoint for orders |
| PATIENT-01 | 系統能以身份證ID + 姓名唯一識別患者 | Entity has idNumber (unique); need composite index for lookup |
| PATIENT-02 | 系統能保存患者基本資料（聯絡方式、病史、過敏史等） | Entity complete; fields exist |
| PATIENT-03 | 患者資料支援快速搜尋與篩選 | Basic findAll exists; needs indexed query by idNumber+name |

---

## Standard Stack

### Core (Already Selected)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS | 11.0.1 | Backend framework | Enterprise patterns, validation, guards, event emitter for side effects |
| TypeORM | 0.3.28 | Database ORM | Entity-based schema, repositories, transactions, multi-database support |
| Vue 3 | 3.5.25 | Frontend framework | Reactive UI, component reuse, composables for API integration |
| Pinia | 3.0.4 | State management (frontend) | Vue 3 native, localStorage persistence, computed properties |
| Naive UI | 2.43.2 | Component library | Medical/enterprise UI patterns, tables, forms, dialogs |
| Axios | 1.13.5 | HTTP client | Request/response interceptors for clinic context, auth headers |
| SQLite | 5.1.7 (dev), PostgreSQL (prod) | Database | SQLite for development simplicity, PostgreSQL for production scalability |
| Decimal.js | 10.6.0 | Precise numeric | Financial calculations (prices, points), prevents float rounding errors |

### Supporting (Already Integrated)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-validator | 0.14.3 | DTO validation | All endpoint request validation automatically |
| class-transformer | 0.5.1 | Object transformation | Entity → DTO conversion in service responses |
| @nestjs/event-emitter | 3.0.1 | Event-driven communication | Treatment completion triggers revenue/points side effects |
| @nestjs/jwt | 11.0.2 | JWT authentication | User auth, stored in localStorage on frontend |
| passport-jwt | 4.0.1 | Passport strategy | JWT validation in guards |
| Jest | 30.0.0 | Unit/integration testing | Backend test framework with 90% coverage requirement |
| ts-jest | 29.2.5 | TypeScript Jest transform | Compile TypeScript specs to JS during test run |
| supertest | 7.0.0 | HTTP assertion library | Test REST endpoints with request/response assertions |

## Architecture Patterns

### Recommended Project Structure (Backend Treatment Domain)

```
backend/src/
├── treatments/
│   ├── controllers/
│   │   ├── treatment-course.controller.ts        # POST/GET courses, sessions
│   │   └── medical-order.controller.ts           # NEW: POST/GET orders
│   ├── services/
│   │   ├── treatment-course.service.ts           # CREATE/UPDATE/QUERY courses
│   │   ├── treatment-session.service.ts          # Complete sessions, track progress
│   │   ├── medical-order.service.ts              # NEW: CRUD orders
│   │   └── treatment-course-template.service.ts  # Template management
│   ├── entities/
│   │   ├── treatment-course.entity.ts            # Course (套餐) with status
│   │   ├── treatment-session.entity.ts           # Individual session within course
│   │   ├── medical-order.entity.ts               # NEW: Prescription/order
│   │   └── treatment-course-template.entity.ts   # Template definitions
│   ├── dto/
│   │   ├── create-treatment-course.dto.ts
│   │   ├── create-medical-order.dto.ts           # NEW
│   │   └── ...
│   └── treatments.module.ts                      # Module exports
├── patients/
│   ├── controllers/
│   │   └── patient.controller.ts                 # GET /patients, GET /patients/:id
│   ├── services/
│   │   └── patient.service.ts                    # findByIdNumber, findByIdAndName, fast search
│   ├── entities/
│   │   └── patient.entity.ts                     # Has idNumber (unique), clinicId
│   └── patients.module.ts
└── common/
    ├── guards/
    │   └── clinic-context.guard.ts               # Multi-tenant enforcement
    ├── middleware/
    │   └── clinic-auth.middleware.ts             # Extract clinicId from header
    └── audit/
        └── audit-log.entity.ts                   # Mutation tracking
```

### Recommended Project Structure (Frontend Treatment Domain)

```
frontend/src/
├── views/
│   ├── TreatmentCourseList.vue                   # Patient/staff treatment list
│   ├── TreatmentCourseDetail.vue                 # Single course detail + sessions
│   ├── MedicalOrderList.vue                      # NEW: Patient/staff order list
│   ├── MedicalOrderDetail.vue                    # NEW: Single order detail
│   └── PatientSearch.vue                         # idNumber + name lookup
├── components/
│   ├── TreatmentSessionCard.vue                  # Render session progress
│   ├── TreatmentProgressBar.vue                  # Visual progress (N/M completed)
│   ├── MedicalOrderForm.vue                      # NEW: Create/edit order
│   └── PatientIdentifier.vue                     # idNumber + name input
├── services/
│   ├── api.ts                                    # Base Axios with interceptors
│   ├── treatments-api.ts                         # GET/POST /treatments
│   └── medical-orders-api.ts                     # NEW: GET/POST /medical-orders
├── stores/
│   └── user.ts                                   # Auth + clinicId
└── types/
    ├── treatment.ts
    └── medical-order.ts                          # NEW
```

### Pattern 1: Treatment Course Lifecycle (Complete → In Progress → Completed)

**What:** Track a multi-session course from creation through session-by-session completion to final status.

**When to use:** All patient treatment packages are courses with multiple sessions.

**Example:**

```typescript
// Backend: Entity tracks status at course level, progress computed from sessions
// Source: backend/src/treatments/entities/treatment-course.entity.ts
@Entity("treatment_courses")
export class TreatmentCourse {
  @Column({ type: "varchar", length: 50, default: "active" })
  status: "active" | "completed" | "abandoned"; // Course-level state

  completedAt: Date; // Set when status → completed

  @OneToMany(() => TreatmentSession, (s) => s.treatmentCourse)
  sessions: TreatmentSession[]; // 1-N sessions (N = totalSessions)
}

// Service calculates progress
export class TreatmentCourseService {
  getProgressPercent(course: TreatmentCourse): number {
    const completed = course.sessions.filter(
      (s) => s.completionStatus === "completed"
    ).length;
    return (completed / course.sessions.length) * 100;
  }
}

// Frontend: Display progress bar
<TreatmentProgressBar
  completed={course.sessions.filter(s => s.completionStatus === 'completed').length}
  total={course.sessions.length}
/>
```

### Pattern 2: Multi-Tenant Isolation with clinicId

**What:** Every table has clinicId column; queries always filter by clinicId; middleware enforces context.

**When to use:** All queries and mutations to ensure data isolation between clinics.

**Example:**

```typescript
// Entity includes clinicId
// Source: backend/src/treatments/entities/treatment-course.entity.ts
@Entity("treatment_courses")
@Index(["clinicId", "patientId"]) // Composite index for fast clinic+patient queries
export class TreatmentCourse {
  @Column({ type: "varchar", length: 32 })
  clinicId: string;
}

// Service always filters by clinicId
async getPatientCourses(patientId: string, clinicId: string): Promise<TreatmentCourse[]> {
  return this.courseRepository.find({
    where: { patientId, clinicId }, // Both required
  });
}

// Guard enforces context
@UseGuards(ClinicContextGuard)
@Get("courses/:courseId")
async getCourse(@Param("courseId") id: string, @Query("clinicId") clinicId: string) {
  return this.service.getCourseById(id, clinicId);
}
```

### Pattern 3: Service Layer Business Logic (CRUD + State Transitions)

**What:** Services encapsulate domain logic (validation, state transitions, side effects), injecting repositories.

**When to use:** All data mutations and complex queries.

**Example:**

```typescript
// Source: backend/src/treatments/services/treatment-course.service.ts
@Injectable()
export class TreatmentCourseService {
  constructor(
    @InjectRepository(TreatmentCourse)
    private courseRepo: Repository<TreatmentCourse>,
    private sessionRepo: Repository<TreatmentSession>,
  ) {}

  // Validation + Transaction + Side Effect
  async createCourse(dto: CreateTreatmentCourseDto): Promise<TreatmentCourse> {
    // 1. Validate inputs
    // 2. Fetch template
    // 3. Calculate actualPayment = price - pointsToRedeem
    // 4. In transaction: save course + generate N sessions
    // 5. Call pointsService.redeemPoints() if applicable
  }

  // State transition
  async updateCourseStatus(
    courseId: string,
    clinicId: string,
    status: "active" | "completed" | "abandoned"
  ): Promise<TreatmentCourse> {
    const course = await this.getCourseById(courseId, clinicId);
    course.status = status;
    if (status === "completed") course.completedAt = new Date();
    return this.courseRepo.save(course);
  }
}
```

### Pattern 4: Status Tracking via Enums in Columns

**What:** Use string enum columns (not separate status tables) for simple state machines.

**When to use:** 2-5 possible states (pending → in-progress → completed/cancelled).

**Example:**

```typescript
// Entity column with literal type
@Column({ type: "varchar", length: 50, default: "pending" })
status: "pending" | "in_progress" | "completed" | "cancelled";

// Service enforces valid transitions
const validTransitions = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

if (!validTransitions[currentStatus].includes(newStatus)) {
  throw new BadRequestException("Invalid status transition");
}
```

### Anti-Patterns to Avoid

- **Hand-rolling patient search:** Don't implement client-side idNumber+name filtering. Use indexed database queries with WHERE clauses.
- **Creating separate history tables:** Don't duplicate treatment data. Audit logs capture mutations; add audit table once, use everywhere.
- **Magic string status values:** Don't use "s1", "s2", "done". Use semantic names: "pending", "completed", "abandoned".
- **Skipping transactions for multi-entity saves:** Don't save course then sessions separately. Wrap in `dataSource.transaction()` to prevent partial failures.
- **Missing clinicId checks:** Don't assume user.clinicId matches request.clinicId. Always validate in guards.
- **Forgetting to set timestamps:** Don't let completedAt be null for completed courses. Set in service during status transition.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Patient identification by idNumber + name | Custom search algorithm | TypeORM with `@Index(["clinicId", "idNumber", "name"])` + `find({ where: { clinicId, idNumber, name } })` | Database indexes are 100-1000x faster; prevents N+1 queries; supports pagination |
| Status state machine validation | Manual string comparisons | Define enum + validTransitions map in service | Prevents invalid state transitions; centralized business rules |
| Multi-entity atomic saves | Sequential saves (course, then sessions) | `dataSource.transaction()` wrapper | Prevents orphaned data if second save fails |
| API clinic isolation | Post-filter by clinic in code | `@UseGuards(ClinicContextGuard)` + always filter queries by clinicId | Guards prevent unauthorized access at request level; database filters ensure isolation |
| Treatment progress calculation | Separate progress table | Computed property on course (count sessions with status="completed" / total) | Eliminates redundant data; always up-to-date; no sync bugs |
| Medical order status tracking | Custom audit columns | Enum column + completedAt/cancelledAt timestamps like TreatmentCourse | Standard pattern; audit logs capture state changes |
| Patient data serialization for API | Manual field picking | class-transformer + @Exclude() on sensitive fields (password, etc.) | Prevents accidental exposure; automatic with DTOs |

## Common Pitfalls

### Pitfall 1: Missing Clinic Isolation in New Queries

**What goes wrong:** New patient search endpoint returns all patients across all clinics, not just the requesting clinic.

**Why it happens:** Forgot to add `clinicId` filter in PatientService.findByIdNumber() method.

**How to avoid:**
- Every repository query includes `where: { clinicId, ... }`
- Use @Index on (clinicId, otherField) for fast lookups
- Test multi-tenant scenarios: create patient in clinic-A, verify clinic-B can't see it

**Warning signs:**
- `find()` query has no clinicId in where clause
- Test passes with single clinic, fails when running full suite with multiple clinics

### Pitfall 2: Forgetting completedAt Timestamp When Marking Treatment Complete

**What goes wrong:** Course shows status="completed" but completedAt is null, breaking audit logs and reporting.

**Why it happens:** Service updates status but skips the timestamp assignment: `course.status = "completed"` without `course.completedAt = new Date()`.

**How to avoid:**
- In updateCourseStatus(), always set completedAt when status → "completed"
- In tests, assert `course.completedAt !== null` when status="completed"
- Add DB constraint: `NOT NULL completedAt WHEN status="completed"`

**Warning signs:**
- Audit logs show status change but no associated timestamp
- Reports show incomplete courses that are marked completed

### Pitfall 3: Medical Order Status Never Updates Past Created State

**What goes wrong:** MedicalOrder created, but no endpoint exists to update to "in-progress" or "completed" — patient sees stale status forever.

**Why it happens:** Built only create endpoint (SCRIPT-01), skipped update endpoint logic.

**How to avoid:**
- Implement both create + update endpoints for SCRIPT-01 and SCRIPT-02
- Add service methods: createOrder(), updateOrderStatus(), getPatientOrders()
- Controller has PUT endpoint: `PUT /medical-orders/:orderId` with status validation
- Test all status transitions: created → in_progress → completed

**Warning signs:**
- Medical order endpoints only have GET (read) and POST (create), missing PUT (update)
- Patient can view orders but they never change status

### Pitfall 4: Staff Assignment Not Scoped to Session Dates

**What goes wrong:** Staff assigned to session scheduled for 2026-03-26 can work on 2026-04-26, causing scheduling chaos.

**Why it happens:** StaffAssignment only stores staffId + sessionId, missing validation that assignment date matches session date.

**How to avoid:**
- StaffAssignment should reference TreatmentSession.scheduledDate
- Validate: `assignment.createdAt <= session.scheduledDate`
- For multi-date courses, staff assigned per-session (not course-wide)

**Warning signs:**
- Staff schedule conflicts not caught before session creation
- Multiple staff "assigned" to same session at different times

### Pitfall 5: Progress Calculation Includes Cancelled Sessions

**What goes wrong:** Patient sees "5/10 sessions complete" but 3 were cancelled, inflating progress bar.

**Why it happens:** Progress query counts all non-pending sessions: `sessions.filter(s => s.completionStatus !== "pending").length`.

**How to avoid:**
- Count ONLY completed: `sessions.filter(s => s.completionStatus === "completed").length`
- Cancelled sessions still exist but don't contribute to progress or pricing
- Display separately: "5 completed, 2 cancelled, 3 pending"

**Warning signs:**
- Progress bar reaches 100% but patient has pending/cancelled sessions
- Revenue calculated includes cancelled sessions

### Pitfall 6: Patient idNumber Not Indexed

**What goes wrong:** "Patient search by ID" endpoint takes 5 seconds on 1000 patients (full table scan).

**Why it happens:** Column exists but no database index: missing `@Index(["clinicId", "idNumber"])`.

**How to avoid:**
- Add index at entity level: `@Index(["clinicId", "idNumber"])`
- Test with composite index for clinic+id lookup: `find({ where: { clinicId, idNumber } })`
- Verify query plan: `EXPLAIN SELECT * FROM patients WHERE clinicId=? AND idNumber=?`

**Warning signs:**
- First search is fast, 10th search is slow (suggests no caching, index missing)
- Patient list grows; search time grows linearly instead of staying constant

## Code Examples

Verified patterns from existing codebase:

### Treatment Course Creation with Session Generation

```typescript
// Source: backend/src/treatments/services/treatment-course.service.ts
async createCourse(dto: CreateTreatmentCourseDto): Promise<TreatmentCourse> {
  // 1. Validate inputs
  this.validateCreateCourseInput(dto);

  // 2. Fetch and validate template
  const template = await this.templateService.getTemplateById(dto.templateId, dto.clinicId);
  if (!template) throw new NotFoundException("課程模板不存在");

  // 3. Calculate payment
  const pointsRedeemed = new Decimal(dto.pointsToRedeem || 0);
  const totalPrice = new Decimal(template.totalPrice);
  if (pointsRedeemed.greaterThan(totalPrice)) {
    throw new BadRequestException("點數抵扣金額不能超過套餐價格");
  }
  const actualPayment = totalPrice.minus(pointsRedeemed);

  // 4. Atomic save in transaction
  const course = await this.dataSource.transaction(async (manager) => {
    const newCourse = new TreatmentCourse();
    newCourse.patientId = dto.patientId;
    newCourse.templateId = dto.templateId;
    newCourse.status = "active";
    newCourse.purchaseDate = new Date();
    newCourse.purchaseAmount = totalPrice;
    newCourse.pointsRedeemed = pointsRedeemed;
    newCourse.actualPayment = actualPayment;
    newCourse.clinicId = dto.clinicId;

    const savedCourse = await manager.save(newCourse);

    // Generate 1-N sessions
    const sessionPrice = actualPayment.dividedBy(template.totalSessions);
    for (let i = 1; i <= template.totalSessions; i++) {
      const session = new TreatmentSession();
      session.treatmentCourseId = savedCourse.id;
      session.sessionNumber = i;
      session.completionStatus = "pending";
      session.sessionPrice = sessionPrice;
      session.clinicId = dto.clinicId;
      await manager.save(session);
    }
    return savedCourse;
  });

  // 5. Handle side effects (points redemption)
  if (pointsRedeemed.greaterThan(0)) {
    await this.pointsService.redeemPoints(
      dto.patientId,
      pointsRedeemed.toNumber(),
      dto.clinicId,
      course.id,
    );
  }

  return course;
}
```

### Multi-Tenant Patient Query with Indexed Lookup

```typescript
// Pattern: Use @Index for composite lookups
// Add to Patient entity:
@Entity("patients")
@Index(["clinicId", "idNumber"]) // For fast ID-based lookup
@Index(["clinicId", "name"]) // For fast name-based search
export class Patient {
  @Column({ type: "varchar", length: 20, nullable: true, unique: true })
  idNumber: string; // e.g., "A123456789"

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;
}

// Service: Fast indexed queries
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async findByIdNumber(idNumber: string, clinicId: string): Promise<Patient | null> {
    return this.patientRepo.findOne({
      where: { clinicId, idNumber }, // Uses index
    });
  }

  async findByIdAndName(idNumber: string, name: string, clinicId: string): Promise<Patient | null> {
    return this.patientRepo.findOne({
      where: { clinicId, idNumber, name }, // Multi-condition with index
    });
  }

  async searchByName(name: string, clinicId: string, limit: number = 20): Promise<Patient[]> {
    return this.patientRepo.find({
      where: {
        clinicId,
        name: Like(`%${name}%`), // Prefix search with index on (clinicId, name)
      },
      take: limit,
    });
  }
}

// Controller: Patient lookup endpoint for PATIENT-01
@Controller("patients")
@UseGuards(JwtAuthGuard, ClinicContextGuard)
export class PatientController {
  @Get("search")
  async searchPatient(
    @Query("idNumber") idNumber?: string,
    @Query("name") name?: string,
    @Query("clinicId") clinicId?: string,
  ) {
    if (!clinicId) throw new BadRequestException("clinicId required");

    if (idNumber && name) {
      return this.patientService.findByIdAndName(idNumber, name, clinicId);
    } else if (idNumber) {
      return this.patientService.findByIdNumber(idNumber, clinicId);
    } else if (name) {
      return this.patientService.searchByName(name, clinicId);
    }
    throw new BadRequestException("Provide idNumber or name");
  }
}
```

### Treatment Progress Calculation

```typescript
// Source: Computed from backend/src/treatments/entities/treatment-course.entity.ts
// & treatment-course.service.ts

// Entity structure
export class TreatmentCourse {
  @OneToMany(() => TreatmentSession, (s) => s.treatmentCourse)
  sessions: TreatmentSession[]; // 1-N sessions
}

// DTO for API response (includes computed progress)
export class TreatmentCourseResponseDto {
  id: string;
  patientId: string;
  status: string;
  completedSessionsCount: number; // Computed
  totalSessionsCount: number; // From sessions array length
  progressPercent: number; // Computed: (completed/total) * 100
  sessions: TreatmentSessionDto[];
}

// Service: Compute progress
export class TreatmentCourseService {
  async getCourseById(courseId: string, clinicId: string): Promise<TreatmentCourse> {
    return this.courseRepository.findOne({
      where: { id: courseId, clinicId },
      relations: ["sessions"],
    });
  }

  // In controller or before returning to client:
  mapToResponseDto(course: TreatmentCourse): TreatmentCourseResponseDto {
    const completed = course.sessions.filter(
      (s) => s.completionStatus === "completed"
    ).length;
    const total = course.sessions.length;
    return {
      ...course,
      completedSessionsCount: completed,
      totalSessionsCount: total,
      progressPercent: total > 0 ? (completed / total) * 100 : 0,
      sessions: course.sessions,
    };
  }
}

// Frontend: Display progress
<template>
  <div>
    <h2>{{ course.name }}</h2>
    <div class="progress">
      <div class="progress-bar" :style="{ width: `${course.progressPercent}%` }"></div>
    </div>
    <p>{{ course.completedSessionsCount }} / {{ course.totalSessionsCount }} 課程已完成</p>
  </div>
</template>

<script setup>
const props = defineProps<{ course: TreatmentCourseResponseDto }>();
</script>
```

### Medical Order (Script) Entity & Status Transitions

```typescript
// NEW: Entity for SCRIPT-01, SCRIPT-02, SCRIPT-03
// backend/src/treatments/entities/medical-order.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Patient } from "../../patients/entities/patient.entity";
import Decimal from "decimal.js";

@Entity("medical_orders")
@Index(["clinicId", "patientId"])
@Index(["clinicId", "status"])
export class MedicalOrder {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 32 })
  patientId: string;

  @Column({ type: "varchar", length: 32 })
  createdByStaffId: string; // Doctor/physician who issued order

  @Column({ type: "varchar", length: 255 })
  medication: string; // e.g., "Paracetamol 500mg"

  @Column({ type: "text", nullable: true })
  dosage: string; // e.g., "1 tablet twice daily"

  @Column({ type: "text", nullable: true })
  usage: string; // e.g., "Oral, after meals"

  @Column({ type: "int", nullable: true })
  quantity: number; // Number of doses/tablets

  @Column({ type: "date" })
  issuedDate: Date;

  @Column({ type: "date", nullable: true })
  expiryDate: Date;

  @Column({ type: "varchar", length: 50, default: "not_started" })
  status: "not_started" | "in_progress" | "completed" | "cancelled"; // SCRIPT-02

  @Column({ type: "datetime", nullable: true })
  startedAt: Date;

  @Column({ type: "datetime", nullable: true })
  completedAt: Date;

  @Column({ type: "datetime", nullable: true })
  cancelledAt: Date;

  @Column({ type: "text", nullable: true })
  cancelReason: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "varchar", length: 32 })
  clinicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Patient, { eager: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "patientId" })
  patient: Patient;
}

// Service: SCRIPT-01, SCRIPT-02 operations
@Injectable()
export class MedicalOrderService {
  constructor(
    @InjectRepository(MedicalOrder)
    private orderRepo: Repository<MedicalOrder>,
  ) {}

  // SCRIPT-01: Create medical order
  async createOrder(dto: CreateMedicalOrderDto): Promise<MedicalOrder> {
    const order = new MedicalOrder();
    order.patientId = dto.patientId;
    order.createdByStaffId = dto.createdByStaffId;
    order.medication = dto.medication;
    order.dosage = dto.dosage;
    order.usage = dto.usage;
    order.quantity = dto.quantity;
    order.issuedDate = new Date();
    order.expiryDate = dto.expiryDate;
    order.status = "not_started";
    order.clinicId = dto.clinicId;
    return this.orderRepo.save(order);
  }

  // SCRIPT-02: Update order status
  async updateOrderStatus(
    orderId: string,
    clinicId: string,
    status: "not_started" | "in_progress" | "completed" | "cancelled",
    reason?: string,
  ): Promise<MedicalOrder> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, clinicId },
    });
    if (!order) throw new NotFoundException("Order not found");

    const validTransitions = {
      not_started: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
    }

    order.status = status;
    if (status === "in_progress") order.startedAt = new Date();
    if (status === "completed") order.completedAt = new Date();
    if (status === "cancelled") {
      order.cancelledAt = new Date();
      order.cancelReason = reason;
    }
    return this.orderRepo.save(order);
  }

  // SCRIPT-03: Get patient orders
  async getPatientOrders(patientId: string, clinicId: string): Promise<MedicalOrder[]> {
    return this.orderRepo.find({
      where: { patientId, clinicId },
      order: { issuedDate: "DESC" },
    });
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| String-based status ("s1", "s2") | Semantic status enums ("pending", "completed") | TypeORM v0.2→v0.3 | Clearer error messages, self-documenting code |
| Manual clinic isolation checks in every service method | Clinic context guard + middleware + indexed queries | NestJS 9+ with guards | Single point of enforcement, prevents bypass |
| Float numbers for money | Decimal.js with transformer | Initial codebase design | Eliminates rounding errors, accurate financial calculations |
| Separate history/audit tables for each entity | Single global AuditLog table with entity type + changes JSON | DDD pattern adoption | Fewer tables, audit works for all entities |
| Client-side search filtering | Server-side indexed database queries with LIKE/pagination | Performance tuning phase | Scales to 100K+ patients, mobile-friendly |

**Deprecated/outdated:**
- Manually written SQL queries: Use TypeORM repository API (already done in codebase)
- Session-based authentication: Replaced with JWT (already done; localStorage persistence on frontend)
- Single-database architecture: Now supports SQLite (dev) + PostgreSQL (prod) via environment config (already done)

## Open Questions

1. **Medical Order Linked to Course or Standalone?**
   - What we know: Phase 1 treats as standalone (separate entity); not explicitly linked to TreatmentCourse
   - What's unclear: Should completing a course auto-complete associated orders?
   - Recommendation: Implement standalone first (simpler); add event listener in Phase 2 if needed

2. **Patient Identification Uniqueness — Per-Clinic or Global?**
   - What we know: idNumber has `unique: true` globally in current entity
   - What's unclear: Can clinic-A and clinic-B have patients with same idNumber?
   - Recommendation: Change to composite unique index `@Unique(["clinicId", "idNumber"])` if multi-clinic separation is strict

3. **Medical Order Expiry Enforcement**
   - What we know: expiryDate column exists
   - What's unclear: Should expired orders be auto-marked "completed" or left for manual action?
   - Recommendation: Add scheduled job in Phase 2; for Phase 1, just store date and return in API

4. **Staff Assignment Granularity — Per-Course or Per-Session?**
   - What we know: Current StaffAssignment references TreatmentSession (per-session)
   - What's unclear: Can one therapist be assigned to all 10 sessions of a course in bulk, or one-by-one?
   - Recommendation: Allow both; bulk-assign endpoint for convenience, per-session override for flexibility

---

## Validation Architecture

> Nyquist validation is enabled in `.planning/config.json` (`workflow.nyquist_validation: true`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.0.0 (backend), @playwright/test 1.58.2 (e2e) |
| Config file | `backend/jest.config.js` (in package.json) |
| Quick run command | `npm run test -- --testPathPattern="treatment-course.service.spec"` |
| Full suite command | `npm run test:cov` (generates coverage report to ./coverage) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COURSE-01 | Create new course with N sessions | unit + integration | `npm test -- treatment-course.service.spec` | ✅ |
| COURSE-02 | Update course status (active → completed) | unit | `npm test -- treatment-course.service.spec` | ✅ |
| COURSE-03 | Calculate progress (X/N sessions complete) | unit | Add computed test in treatment-course.service.spec | ❌ Wave 0 |
| COURSE-04 | Assign staff to session | integration | Add test in treatment-session.service.spec | ❌ Wave 0 |
| COURSE-05 | Patient views own courses via GET /treatments/courses?patientId=X | integration | Add endpoint test | ❌ Wave 0 |
| SCRIPT-01 | Create medical order | unit | Create medical-order.service.spec | ❌ Wave 0 |
| SCRIPT-02 | Update order status with valid transitions | unit | Create medical-order.service.spec | ❌ Wave 0 |
| SCRIPT-03 | Patient views orders via GET /medical-orders?patientId=X | integration | Create medical-order.controller.spec | ❌ Wave 0 |
| PATIENT-01 | Find patient by idNumber + name uniqueness | unit | Create patient.service.spec | ❌ Wave 0 |
| PATIENT-02 | Patient data has all fields (contact, allergies, etc.) | unit | Patient entity test | ✅ (implicit) |
| PATIENT-03 | Search patients by name with pagination | integration | Add patient search endpoint test | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="[feature-name]"` (quick, ~5-10 seconds)
- **Per wave merge:** `npm run test:cov` (full suite, ~30 seconds; must reach 90%)
- **Phase gate:** Full suite green + coverage ≥ 90% before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/src/treatments/services/treatment-course-progress.service.spec.ts` — covers COURSE-03 (progress calculation)
- [ ] `backend/src/treatments/services/medical-order.service.spec.ts` — covers SCRIPT-01, SCRIPT-02
- [ ] `backend/src/treatments/controllers/medical-order.controller.spec.ts` — covers SCRIPT-03 (patient API)
- [ ] `backend/src/patients/services/patient.service.spec.ts` — covers PATIENT-01, PATIENT-03 (search/uniqueness)
- [ ] Database seed file: `backend/scripts/seed-treatment-data.ts` — test data for integration tests (treatment courses, orders, patients)
- [ ] Test utilities: `backend/test/factories/` — factories for TreatmentCourse, MedicalOrder, Patient entities

**Coverage target:** 90% = all services + controllers in Phase 1 scope (treatment-course, medical-order, patient) must have ≥ 90% line coverage.

---

## Sources

### Primary (HIGH confidence)

- **Existing Codebase Analysis** - Direct examination of:
  - TreatmentCourse entity, service, controller (fully implemented)
  - TreatmentSession entity with completionStatus tracking (fully implemented)
  - TreatmentCourseTemplate entity and service (fully implemented)
  - Patient entity with idNumber field (fully implemented)
  - Multi-tenant patterns via clinicId and guards (fully implemented)
  - Database config supporting SQLite + PostgreSQL (fully implemented)

- **NestJS Best Practices** - Official docs:
  - Module/Service/Controller layering: [NestJS Architecture](https://docs.nestjs.com/modules)
  - Guards and Middleware: [NestJS Guards](https://docs.nestjs.com/guards)
  - Event-driven pattern: [@nestjs/event-emitter](https://docs.nestjs.com/techniques/events)
  - Testing with @nestjs/testing: [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

- **TypeORM Best Practices** - Official docs:
  - Entity relationships and queries: [TypeORM Relations](https://typeorm.io/relations)
  - Transactions: [TypeORM Transactions](https://typeorm.io/transactions)
  - Indexes and performance: [TypeORM Indices](https://typeorm.io/indices)

### Secondary (MEDIUM confidence)

- **Project Requirements** - `.planning/REQUIREMENTS.md` specifies all COURSE-*, SCRIPT-*, PATIENT-* requirements
- **Project Architecture** - `.planning/codebase/ARCHITECTURE.md` documents DDD layering, event-driven patterns, multi-tenant enforcement
- **Technology Stack** - `.planning/codebase/STACK.md` confirms Jest 30.0.0, TypeORM 0.3.28, NestJS 11.0.1 versions

### Tertiary (LOW confidence)

- None — all critical patterns verified from codebase or official docs.

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — All libraries verified in package.json; NestJS and TypeORM versions confirmed
- **Architecture Patterns:** HIGH — Existing code demonstrates treatment lifecycle, multi-tenant isolation, service-based design
- **Medical Order Implementation:** MEDIUM — Pattern inferred from TreatmentCourse; SCRIPT-01/02/03 entities don't exist yet; design aligns with proven patterns
- **Testing Strategy:** HIGH — Jest config and 31 existing spec files establish patterns; gaps in Wave 0 are explicit
- **Patient Identification:** HIGH — idNumber column exists; recommendation for indexed composite lookup is standard TypeORM practice

**Research date:** 2026-03-26
**Valid until:** 2026-04-30 (stable architecture, 30-day validity)

---

*Phase 1 Research complete. Ready for planner to generate PLAN.md.*

# Phase 02：患者通知系統 - 研究報告

**研究日期：** 2026-03-27
**領域：** NestJS 事件驅動通知系統、多渠道通知（郵件、簡訊、應用內）
**整體信心度：** HIGH（核心架構）/ MEDIUM（SMS 台灣供應商）

---

## 摘要

Phase 2 需要在既有 `@nestjs/event-emitter` 基礎上，為 5 個 NOTIF 需求建立完整的多渠道通知系統。專案**已有** `EventEmitterModule.forRoot()` 全局配置、`session.completed` 與 `treatment.created` 事件的發送點、以及一個未持久化的 `NotificationService` 骨架。

Phase 2 的工作是：(1) 將現有 `NotificationService` 升級為真正持久化到 SQLite 的通知記錄；(2) 建立 `NotificationEventListener` 訂閱治療生命週期事件並觸發通知；(3) 新增郵件（nodemailer）、SMS（every8d 台灣供應商）、應用內通知渠道；(4) 建立患者通知偏好表；(5) 建立前端通知 UI（Vue 3 + Naive UI）。

**主要建議：** 沿用既有 `revenue-event.listener.ts` 的 `@OnEvent({ async: true })` 模式，在 `notifications` 模組內新增 `NotificationEventListener`；郵件用 `@nestjs-modules/mailer`（Handlebars 模板）；SMS 用 `every8d-sms`（台灣最大供應商）；應用內通知用輪詢 REST API（無需引入 WebSocket，降低複雜度）。

---

<phase_requirements>
## 階段需求

| ID | 描述 | 研究支持 |
|----|------|---------|
| NOTIF-01 | 系統能在療程開始時發送患者通知 | 需在 `createCourse` 中 emit `course.started` 事件；listener 觸發多渠道通知 |
| NOTIF-02 | 系統能在療程進度變化時發送提醒（每次課程完成後） | `session.completed` 事件**已存在**於 `treatment-session.service.ts:176`；listener 訂閱即可 |
| NOTIF-03 | 系統能在療程完成時發送結果通知 | `session-session.service.ts` 在最後一 session 完成時更新 course 狀態為 `completed`，但未 emit 事件；需補充 emit `course.completed` |
| NOTIF-04 | 系統能發送預約時間提醒 | `TreatmentSession.scheduledDate` 欄位已存在；需加 `@nestjs/schedule` cron job 在 24h 前掃描並提醒 |
| NOTIF-05 | 支援多渠道通知（郵件、簡訊、應用內通知） | 郵件用 nodemailer；SMS 用 every8d；應用內存 DB 並以 GET /notifications/inbox 輪詢 |
</phase_requirements>

---

## 標準技術堆疊

### 核心套件

| 套件 | 版本 | 用途 | 為何選用 |
|------|------|------|---------|
| `@nestjs/event-emitter` | ^3.0.1 (**已安裝**) | 事件發布/訂閱 | 已在 `app.module.ts` 全局啟用 |
| `@nestjs-modules/mailer` | ^2.x | NestJS 原生郵件發送 | 封裝 nodemailer，提供 DI、Handlebars 模板、async config |
| `nodemailer` | ^6.x | SMTP 郵件底層 | 業界標準；`@nestjs-modules/mailer` 依賴 |
| `handlebars` | ^4.x | 郵件 HTML 模板 | `@nestjs-modules/mailer` 官方推薦模板引擎 |
| `@nestjs/schedule` | ^4.x | Cron 預約提醒排程 | NestJS 官方排程模組，基於 `node-cron` |
| `every8d-sms` | latest | 台灣 SMS 發送 | 台灣最大整合 4 家電信；有 Node.js wrapper |

### 支援套件

| 套件 | 版本 | 用途 | 使用時機 |
|------|------|------|---------|
| `nodemailer-mock` | ^2.x | 測試用郵件 mock | 所有 notification 單元測試 |
| `@types/nodemailer` | ^6.x | TypeScript 型別 | 開發依賴 |

### 已排除替代方案

| 放棄 | 替代 | 棄用原因 |
|------|------|---------|
| BullMQ 隊列 | 直接 async listener | 引入 Redis 依賴；Phase 2 規模不需隊列；失敗記錄存 DB 即可 |
| WebSocket (socket.io) | REST 輪詢 | 引入額外複雜度；診所 CRM 不是即時聊天；30s 輪詢足夠 |
| Twilio | every8d | every8d 為台灣本地供應商；無海外路由；價格更低 |
| pug/ejs 模板 | Handlebars | Handlebars 在 `@nestjs-modules/mailer` 中最成熟、最多文件 |

### 安裝指令

```bash
cd backend
npm install @nestjs-modules/mailer nodemailer handlebars @nestjs/schedule
npm install --save-dev @types/nodemailer nodemailer-mock
npm install every8d-sms
```

---

## 架構模式

### 建議目錄結構

```
backend/src/notifications/
├── dto/
│   ├── create-notification-preference.dto.ts
│   └── notification-inbox-query.dto.ts
├── entities/
│   ├── notification-record.entity.ts      # 持久化通知記錄（取代記憶體陣列）
│   └── notification-preference.entity.ts  # 患者每渠道偏好設定
├── listeners/
│   └── notification-event.listener.ts     # 訂閱 session.completed 等事件
├── services/
│   ├── notification.service.ts            # 重構為持久化版本
│   ├── email-channel.service.ts           # 郵件發送封裝
│   ├── sms-channel.service.ts             # SMS 發送封裝
│   └── notification-scheduler.service.ts  # Cron 預約提醒
├── churn-prediction.service.ts            # 保留不動
├── notifications.controller.ts            # 新增 /inbox 端點
└── notifications.module.ts               # 更新 imports
```

### 模式 1：事件監聽器觸發通知（NOTIF-01/02/03）

**做什麼：** 在 `notifications/listeners/notification-event.listener.ts` 中以 `@OnEvent` 訂閱治療事件，查詢患者偏好後分渠道發送。

**何時使用：** 治療生命週期觸發的通知（開始、進度、完成）。

**關鍵細節：** `session.completed` 事件的 payload 目前只有 `sessionId`、`treatmentCourseId`、`patientId`，無 `patientEmail`/`patientPhone`。Listener 需要從 `PatientRepository` 查詢聯絡資訊。

```typescript
// Source: 參考 src/revenue/listeners/revenue-event.listener.ts 既有模式
@Injectable()
export class NotificationEventListener {
  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  @OnEvent('session.completed', { async: true })
  async handleSessionCompleted(event: {
    sessionId: string;
    treatmentCourseId: string;
    patientId: string;
    completedAt: Date;
  }) {
    const patient = await this.patientRepository.findOne({
      where: { id: event.patientId },
    });
    if (!patient) return;

    await this.notificationService.sendTreatmentProgressNotification({
      patient,
      sessionId: event.sessionId,
      courseId: event.treatmentCourseId,
    });
  }
}
```

### 模式 2：NotificationRecord 實體（持久化）

**做什麼：** 將現有記憶體陣列 (`private notifications: Notification[]`) 替換為 TypeORM 實體，確保應用重啟後通知歷史不遺失，同時支援「應用內通知」的前端輪詢。

```typescript
// Source: 根據既有 Patient entity 模式設計
@Entity('notification_records')
@Index(['clinicId', 'patientId'])
@Index(['clinicId', 'isRead'])
export class NotificationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'varchar', length: 32 })
  patientId: string;

  @Column({ type: 'varchar', length: 20 })
  channel: 'email' | 'sms' | 'in_app';

  @Column({ type: 'varchar', length: 30 })
  eventType: 'course_started' | 'session_completed' | 'course_completed' | 'appointment_reminder';

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'sent' | 'failed';

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;  // 僅用於 in_app 渠道

  @Column({ type: 'varchar', length: 32, nullable: true })
  relatedEntityId: string;  // sessionId 或 courseId

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  sentAt: Date;
}
```

### 模式 3：NotificationPreference 實體（患者偏好）

**做什麼：** 每位患者有一筆偏好記錄，控制各渠道的 opt-in/opt-out。

```typescript
@Entity('notification_preferences')
@Index(['clinicId', 'patientId'], { unique: true })
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  clinicId: string;

  @Column({ type: 'varchar', length: 32 })
  patientId: string;

  // 渠道總開關
  @Column({ type: 'boolean', default: true })
  emailEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  smsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  inAppEnabled: boolean;

  // 事件類型開關
  @Column({ type: 'boolean', default: true })
  notifyOnCourseStart: boolean;

  @Column({ type: 'boolean', default: true })
  notifyOnSessionComplete: boolean;

  @Column({ type: 'boolean', default: true })
  notifyOnCourseComplete: boolean;

  @Column({ type: 'boolean', default: true })
  notifyOnAppointmentReminder: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 模式 4：Cron 預約提醒（NOTIF-04）

**做什麼：** 每天早上 8:00 掃描 `scheduledDate` 為明天的 TreatmentSession，發送提醒。

```typescript
// Source: @nestjs/schedule 官方文件
@Injectable()
export class NotificationSchedulerService {
  constructor(
    @InjectRepository(TreatmentSession)
    private readonly sessionRepository: Repository<TreatmentSession>,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 8 * * *', { timeZone: 'Asia/Taipei' })
  async sendAppointmentReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await this.sessionRepository.find({
      where: {
        scheduledDate: Between(startOfDay(tomorrow), endOfDay(tomorrow)),
        completionStatus: 'pending',
      },
      relations: ['treatmentCourse', 'treatmentCourse.patient'],
    });

    for (const session of sessions) {
      await this.notificationService.sendAppointmentReminder(session);
    }
  }
}
```

### 模式 5：郵件渠道（@nestjs-modules/mailer）

```typescript
// MailModule 配置（backend/src/mail/mail.module.ts）
MailerModule.forRootAsync({
  useFactory: () => ({
    transport: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    defaults: {
      from: '"Doctor CRM" <noreply@clinic.com>',
    },
    template: {
      dir: join(__dirname, 'templates'),
      adapter: new HandlebarsAdapter(),
      options: { strict: true },
    },
  }),
})
```

### 模式 6：SMS 渠道（every8d）

```typescript
// Source: https://github.com/fugle-dev/every8d-sms
import * as Every8d from 'every8d-sms';

@Injectable()
export class SmsChannelService {
  async send(phoneNumber: string, message: string): Promise<void> {
    // every8d 台灣電話格式：09XXXXXXXX
    await Every8d.send(
      process.env.EVERY8D_UID,
      process.env.EVERY8D_PWD,
      '', // senderName (optional)
      message,
      phoneNumber,
      '', // scheduled time (empty = send now)
      '', // validTime
    );
  }
}
```

### 反面模式：應避免

- **不要在 Controller 中直接發通知：** 必須透過事件或服務，不能在 HTTP 請求鏈中阻塞發送
- **不要在同步 emit 中發 SMS/Email：** 必須使用 `@OnEvent({ async: true })` 避免阻塞主流程
- **不要跳過偏好檢查：** 每次發送前必須查詢 `NotificationPreference`，否則違反患者意願
- **不要用記憶體存通知：** 現有 `private notifications: Notification[]` 在重啟後清空，必須持久化

---

## 不要自己造輪子

| 問題 | 不要建 | 使用 | 原因 |
|------|--------|------|------|
| 郵件發送 | 自訂 SMTP 封裝 | `@nestjs-modules/mailer` | 處理連線池、重試、模板編譯等複雜邏輯 |
| 郵件模板 | 字串拼接 HTML | Handlebars `.hbs` 模板 | 型別安全、跳脫 XSS、版本控制友好 |
| 排程任務 | setInterval | `@nestjs/schedule` @Cron | 處理時區、重啟恢復、動態啟停 |
| 事件訂閱 | 自訂 EventEmitter | `@OnEvent` decorator | 已整合 DI 容器，支援 async、通配符 |
| SMS 台灣 | HTTP fetch 直呼 every8d | `every8d-sms` npm 套件 | 有型別支援、處理編碼和錯誤解析 |

---

## 常見陷阱

### 陷阱 1：`session.completed` 事件 payload 缺少患者聯絡資訊

**發生什麼：** 現有 `session.completed` emit（`treatment-session.service.ts:176`）的 payload 只有 `sessionId`、`treatmentCourseId`、`patientId`，沒有 `patientEmail`、`patientPhone`。

**根本原因：** 事件是在服務層發出的，服務不直接持有患者實體。

**如何避免：** Listener 收到事件後，自行從 `PatientRepository` 以 `patientId` 查詢聯絡資訊。不要修改既有事件 payload（避免破壞 `RevenueEventListener`）。

**警示信號：** 測試中若看到 `recipientEmail: undefined`，代表沒有正確查詢患者資料。

---

### 陷阱 2：`course.completed` 事件目前不存在

**發生什麼：** `TreatmentSessionService.completeSession()` 在最後一 session 完成時更新了 `course.status = 'completed'`（第 195-202 行），但**沒有 emit `course.completed` 事件**。

**根本原因：** Phase 1 未建立療程完成事件。

**如何避免：** Phase 2 Wave 0 需在 `treatment-session.service.ts` 的第 202 行後補充 emit：
```typescript
this.eventEmitter.emit('course.completed', {
  courseId: course.id,
  patientId: session.treatmentCourse.patientId,
  clinicId: session.clinicId,
  completedAt: new Date(),
});
```

同時需補充 `course.started` 事件：在 `treatment-course.service.ts` 的 `createCourse()` 完成後 emit。

---

### 陷阱 3：Handlebars 模板在 NestJS build 時未複製

**發生什麼：** `nest build` 只複製 `.ts` 編譯產物，`.hbs` 模板檔案會被忽略，導致生產環境無法找到模板。

**根本原因：** NestJS CLI 預設只處理 TypeScript 檔案。

**如何避免：** 在 `nest-cli.json` 的 `compilerOptions.assets` 中加入模板資料夾：
```json
{
  "compilerOptions": {
    "assets": [{ "include": "**/*.hbs", "watchAssets": true }]
  }
}
```

---

### 陷阱 4：SQLite 的 DATE 欄位查詢問題

**發生什麼：** TypeORM 在 SQLite 中使用 `Between()` 查詢 `scheduledDate`（存為字串）時，比較行為與 PostgreSQL 不同。

**根本原因：** SQLite 沒有原生 DATE 型別，TypeORM 以字串儲存。

**如何避免：** Cron job 中使用字串格式日期比較，或用 `LIKE` 前綴匹配：
```typescript
const tomorrowStr = format(tomorrow, 'yyyy-MM-dd'); // date-fns
await this.sessionRepository
  .createQueryBuilder('session')
  .where('DATE(session.scheduledDate) = :date', { date: tomorrowStr })
  .getMany();
```

---

### 陷阱 5：every8d SMS 台灣電話號碼格式

**發生什麼：** 台灣手機號碼需要以 `09XXXXXXXX` 格式（10 碼）傳入 every8d；Patient 實體的 `phoneNumber` 欄位格式不限制，可能含有 `+886`、空格或橫線。

**根本原因：** `Patient.phoneNumber` 是 `varchar(20)` 無格式約束。

**如何避免：** 在 `SmsChannelService` 中加入格式化函數，移除非數字字元，並標準化為 `09XXXXXXXX`。

---

## 程式碼範例

### 事件監聽器（完整模式）

```typescript
// Source: 遵循 src/revenue/listeners/revenue-event.listener.ts 既有模式
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  @OnEvent('session.completed', { async: true })
  async handleSessionCompleted(event: {
    sessionId: string;
    treatmentCourseId: string;
    patientId: string;
  }) {
    try {
      const patient = await this.patientRepository.findOne({
        where: { id: event.patientId },
      });
      if (!patient) return;

      await this.notificationService.sendMultiChannel({
        patient,
        eventType: 'session_completed',
        relatedEntityId: event.sessionId,
        title: '療程進度更新',
        message: `您的一次療程已完成，請繼續保持！`,
      });
    } catch (error) {
      this.logger.error(
        `處理 session.completed 通知失敗: ${error.message}`,
        error.stack,
      );
      // 不拋出：避免中斷 revenue listener
    }
  }
}
```

### 患者偏好檢查（核心邏輯）

```typescript
async sendMultiChannel(params: {
  patient: Patient;
  eventType: NotificationEventType;
  title: string;
  message: string;
  relatedEntityId?: string;
}) {
  const pref = await this.preferenceRepo.findOne({
    where: { patientId: params.patient.id, clinicId: params.patient.clinicId },
  });

  // 若無偏好記錄，預設全渠道發送
  const emailEnabled = pref?.emailEnabled ?? true;
  const smsEnabled = pref?.smsEnabled ?? true;
  const inAppEnabled = pref?.inAppEnabled ?? true;

  const shouldSend = this.checkEventPreference(pref, params.eventType);
  if (!shouldSend) return;

  const sends: Promise<void>[] = [];

  if (emailEnabled && params.patient.email) {
    sends.push(this.emailChannel.send(params.patient.email, params.title, params.message));
  }
  if (smsEnabled && params.patient.phoneNumber) {
    sends.push(this.smsChannel.send(params.patient.phoneNumber, params.message));
  }
  if (inAppEnabled) {
    sends.push(this.saveInAppNotification(params));
  }

  await Promise.allSettled(sends); // 某渠道失敗不影響其他渠道
}
```

### 單元測試模式（mock 郵件）

```typescript
// nodemailer-mock 測試模式
import * as mockmailer from 'nodemailer-mock';

describe('EmailChannelService', () => {
  it('應發送療程進度郵件', async () => {
    mockmailer.mock.reset();
    await emailChannel.send('patient@example.com', '療程進度', '您的療程進度更新');
    const sent = mockmailer.mock.getSentMail();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('patient@example.com');
  });
});
```

### Jest mock EventEmitter 模式（參考既有）

```typescript
// Source: 參考 treatment-session.service.spec.ts 既有 mock
const mockEventEmitter = {
  emit: jest.fn(),
};

// 在 providers 中：
{ provide: EventEmitter2, useValue: mockEventEmitter }
```

---

## 技術現況

| 舊做法 | 目前做法 | 變更時間 | 影響 |
|--------|---------|---------|------|
| 記憶體通知陣列 | TypeORM 持久化實體 | Phase 2 | 需資料庫 migration |
| 無真實郵件發送 | @nestjs-modules/mailer | Phase 2 | 需 SMTP 環境變數 |
| 無 SMS 實作 | every8d-sms | Phase 2 | 需 every8d 帳號 |
| 無排程提醒 | @nestjs/schedule Cron | Phase 2 | 需新增 ScheduleModule |
| `push` 型別（無 PWA） | 移除，改為 `in_app` | Phase 2 | 前端改用輪詢 |

**已棄用/需調整：**
- `NotificationService.sendChurnRiskAlert()` 目前以 `type: 'system'` 呼叫；Phase 2 重構後需相容
- `Notification` interface 中的 `type: 'push'` 對本專案沒有意義（無 PWA/FCM），Phase 2 改為 `in_app`

---

## 開放問題

1. **NOTIF-04 的「預約」定義**
   - 已知：`TreatmentSession.scheduledDate` 是預約日期
   - 不確定：提醒應在幾小時/天前發送？
   - 建議：預設 24 小時前（可做成系統設定），使用 Cron 每天 08:00 Taiwan 時間掃描

2. **every8d 測試環境**
   - 已知：`fugle-dev/every8d-sms` npm 套件可用
   - 不確定：測試帳號是否有試用額度
   - 建議：在測試環境用 logger mock，生產環境才呼叫真實 API；環境變數 `SMS_ENABLED=false` 作開關

3. **前端通知 UI 位置**
   - 已知：Frontend 使用 Vue 3 + Naive UI；已有 Pinia store
   - 不確定：應用內通知是否需要 notification bell icon + dropdown？
   - 建議：在 App.vue 頂部導航加入通知圖示，以 30 秒輪詢 GET /notifications/inbox

4. **既有 `NotificationService` 相容性**
   - 已知：`ChurnPredictionService` 依賴 `NotificationService.sendChurnRiskAlert()`
   - 建議：Phase 2 重構 `NotificationService` 時保留現有公開方法簽名，只修改內部實作（記憶體 → DB）

---

## 驗證架構

### 測試框架

| 屬性 | 值 |
|------|---|
| 後端框架 | Jest ^30 |
| 後端設定檔 | `backend/package.json` jest 設定（rootDir: src） |
| 前端框架 | Vitest ^4 |
| 前端設定檔 | `frontend/vite.config.ts`（vitest 設定） |
| 後端快速執行 | `cd backend && npm test -- --testPathPattern=notification` |
| 後端完整執行 | `cd backend && npm run test:cov` |
| 前端快速執行 | `cd frontend && npm run test:unit` |

### 需求 → 測試對應

| 需求 ID | 行為 | 測試類型 | 自動化指令 | 檔案是否存在 |
|---------|------|---------|-----------|------------|
| NOTIF-01 | 建立 TreatmentCourse 後 emit `course.started` 事件 | 單元 | `npm test -- treatment-course.service` | ❌ Wave 0 建立 |
| NOTIF-01 | Listener 收到 `course.started` 後觸發多渠道通知 | 單元 | `npm test -- notification-event.listener` | ❌ Wave 0 建立 |
| NOTIF-02 | `session.completed` 事件觸發進度通知 | 單元 | `npm test -- notification-event.listener` | ❌ Wave 0 建立 |
| NOTIF-03 | 最後 session 完成後 emit `course.completed`，觸發完成通知 | 單元 | `npm test -- treatment-session.service` | ✅（現有 spec，需新增斷言）|
| NOTIF-04 | Cron job 在 scheduledDate 前 24h 發送提醒 | 單元 | `npm test -- notification-scheduler` | ❌ Wave 0 建立 |
| NOTIF-05 | EmailChannelService 呼叫 mailer 並記錄結果 | 單元 | `npm test -- email-channel.service` | ❌ Wave 0 建立 |
| NOTIF-05 | SmsChannelService 格式化電話號碼並呼叫 every8d | 單元 | `npm test -- sms-channel.service` | ❌ Wave 0 建立 |
| NOTIF-05 | GET /notifications/inbox 回傳 in_app 未讀通知 | 整合 | `npm test -- notifications.controller` | ❌ Wave 0 建立 |
| NOTIF-05 | NotificationPreference CRUD 正確控制發送渠道 | 單元 | `npm test -- notification.service` | ❌ Wave 0 建立 |

### 取樣率

- **每次任務提交：** `cd backend && npm test -- --testPathPattern=notification`
- **每次 Wave 合併：** `cd backend && npm run test:cov && cd ../frontend && npm run test:unit`
- **Phase Gate：** 完整套件綠燈後才執行 `/gsd:verify-work`

### Wave 0 缺口

- [ ] `src/notifications/listeners/notification-event.listener.spec.ts` — 覆蓋 NOTIF-01/02/03
- [ ] `src/notifications/services/notification.service.spec.ts` — 覆蓋偏好檢查邏輯
- [ ] `src/notifications/services/email-channel.service.spec.ts` — 使用 nodemailer-mock
- [ ] `src/notifications/services/sms-channel.service.spec.ts` — mock every8d
- [ ] `src/notifications/services/notification-scheduler.service.spec.ts` — 覆蓋 NOTIF-04 cron
- [ ] 更新 `src/treatments/services/treatment-session.service.spec.ts` — 新增 `course.completed` emit 斷言（NOTIF-03）

---

## 資料來源

### 主要（HIGH 信心度）

- 既有 `src/revenue/listeners/revenue-event.listener.ts` — `@OnEvent({ async: true })` 模式直接參考
- 既有 `src/treatments/services/treatment-session.service.ts` — `eventEmitter.emit('session.completed', ...)` 確認事件存在
- 既有 `src/patients/entities/patient.entity.ts` — 確認 `email`、`phoneNumber` 欄位
- `backend/package.json` — 確認 `@nestjs/event-emitter: ^3.0.1` 已安裝
- [NestJS 官方文件 - Events](https://docs.nestjs.com/techniques/events) — `@OnEvent` decorator 用法
- [NestJS 官方文件 - Task Scheduling](https://docs.nestjs.com/techniques/task-scheduling) — `@Cron` decorator

### 次要（MEDIUM 信心度）

- [nest-modules/mailer GitHub](https://github.com/nest-modules/mailer) — `@nestjs-modules/mailer` 配置模式（多篇文章交叉驗證）
- [fugle-dev/every8d-sms GitHub](https://github.com/fugle-dev/every8d-sms) — 台灣 every8d Node.js wrapper
- [nodemailer-mock npm](https://www.npmjs.com/package/nodemailer-mock) — 測試用 mock 套件

### 第三方（LOW 信心度，標示待驗證）

- every8d-sms 套件最後更新時間需驗證（確認是否仍活躍維護）
- `every8d-sms` 的 TypeScript 型別完整度未完全驗證，可能需要自訂 `.d.ts`

---

## Metadata

**信心度分析：**
- 標準技術堆疊：HIGH — `@nestjs/event-emitter` 已安裝並運作；listener 模式在 revenue/referral 中已驗證
- 架構設計：HIGH — 直接沿用既有 module/listener 模式
- SMS 台灣供應商：MEDIUM — every8d Node.js wrapper 存在，但需實際測試 API 整合
- 前端通知 UI：MEDIUM — Vue 3 + Naive UI 確認，但具體組件設計需規劃階段決定

**研究日期：** 2026-03-27
**有效期限：** 2026-04-27（穩定技術；every8d API 需 30 天內驗證）

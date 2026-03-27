# 療程模板和時間戳追蹤系統 - 設計文檔

**日期**: 2026-02-12
**優先級**: 高
**相關系統**: Points 系統、Referrals 系統、PPF 分潤

---

## 1. 概述

實現一個完整的療程管理系統，支持：
- 多種預定義課程模板（含階段配置）
- 詳細的單次療程追蹤（1-10 次）
- 靈活的多治療師 PPF 分配
- 與 Points 系統集成的金額抵扣

---

## 2. 數據模型

### 2.1 TreatmentCourseTemplate（療程課程模板）

預定義的課程套餐模板

```typescript
@Entity('treatment_course_templates')
export class TreatmentCourseTemplate {
  id: string (UUID)
  name: string                    // 例如："10次美容套餐"
  description: string             // 詳細描述
  totalSessions: number           // 總療程次數 (如 10)
  totalPrice: decimal(10,2)       // 套餐總價格
  stageConfig: JSON               // 階段配置
  // [
  //   { stageName: "基礎治療", sessionStart: 1, sessionEnd: 3 },
  //   { stageName: "進階治療", sessionStart: 4, sessionEnd: 7 },
  //   { stageName: "維護", sessionStart: 8, sessionEnd: 10 }
  // ]
  clinicId: string                // 多租戶隔離
  isActive: boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

### 2.2 TreatmentCourse（患者購買的療程套餐）

患者購買的具體療程記錄

```typescript
@Entity('treatment_courses')
export class TreatmentCourse {
  id: string (UUID)
  patientId: string               // 患者 ID
  templateId: string (FK)         // 關聯模板
  status: enum                    // 'active' | 'completed' | 'abandoned'
  purchaseDate: Date              // 購買日期
  purchaseAmount: decimal(10,2)   // 購買總額
  pointsRedeemed: decimal(10,2)   // 已抵扣的點數
  actualPayment: decimal(10,2)    // 實際支付金額 (purchaseAmount - pointsRedeemed)
  clinicId: string                // 多租戶隔離
  completedAt: Date (nullable)    // 全部完成日期
  createdAt: Date
  updatedAt: Date
}
```

### 2.3 TreatmentSession（單次療程 1-10）

每次療程的詳細追蹤

```typescript
@Entity('treatment_sessions')
export class TreatmentSession {
  id: string (UUID)
  treatmentCourseId: string (FK)  // 關聯套餐
  sessionNumber: number           // 1-10
  scheduledDate: Date             // 預定日期
  actualStartTime: Date (nullable)// 實際開始時間
  actualEndTime: Date (nullable)  // 實際結束時間
  completionStatus: enum          // 'pending' | 'completed' | 'cancelled'
  therapistNotes: text (nullable) // 治療師備註
  patientFeedback: text (nullable)// 患者反饋
  sessionPrice: decimal(10,2)     // 單次療程價格 (totalPrice / totalSessions)
  clinicId: string                // 多租戶隔離
  createdAt: Date
  updatedAt: Date

  // 關聯
  staffAssignments: StaffAssignment[] // 1-to-多
}
```

### 2.4 StaffAssignment（治療師分配）

單次療程的治療師分配和 PPF 百分比

```typescript
@Entity('staff_assignments')
export class StaffAssignment {
  id: string (UUID)
  sessionId: string (FK)          // 關聯 session
  staffId: string                 // 治療師 ID
  staffRole: string               // 治療師角色 (醫生、護理師等)
  ppfPercentage: decimal(5,2)     // 該治療師的 PPF 百分比 (0-100)
  ppfAmount: decimal(10,2)        // 該治療師實際獲得的 PPF (計算後)
  createdAt: Date
  updatedAt: Date
}
```

---

## 3. 業務邏輯

### 3.1 建立療程套餐流程

```
步驟 1: 員工進入患者詳情頁面
步驟 2: 在「療程」分頁點擊「新增套餐」
步驟 3: 從下拉式菜單選擇課程模板
        → 自動計算 sessionPrice = totalPrice / totalSessions
步驟 4: (可選) 提前分配治療師給各 session
        → 系統生成 10 個 TreatmentSession，狀態為 'pending'
步驟 5: 點擊確認 → TreatmentCourse 被建立
步驟 6: (可選) 如患者有可用點數 → 詢問是否抵扣
        → actualPayment = purchaseAmount - pointsRedeemed
```

### 3.2 完成單次療程流程

```
步驟 1: 員工打開患者療程詳情 → 找到要完成的 session
步驟 2: 點擊「編輯」按鈕
步驟 3: 填入：
        - 實際開始時間 (timestamp)
        - 實際結束時間 (timestamp)
        - 完成狀態 (標記為已完成)
        - 治療師備註 (可選)
步驟 4: (如未預先分配) 添加治療師並設定 PPF 百分比
        → 百分比必須加總為 100%
步驟 5: 點擊「保存」
        → 觸發 PPF 計算和分配
        → 發送 'session.completed' 事件
步驟 6: 如果這是第 10 次 session → TreatmentCourse 狀態改為 'completed'
```

### 3.3 PPF 計算邏輯

```
當 session 被標記為 'completed' 時：

1. 獲取該 session 的價格：
   sessionPrice = treatmentCourse.actualPayment / treatmentCourse.totalSessions

2. 對於每個分配的治療師：
   therapistPPF = sessionPrice × (staffAssignment.ppfPercentage / 100)

3. 更新 staffAssignment.ppfAmount

4. 發送 'session.completed' 事件，包含：
   - sessionId, treatmentCourseId, patientId
   - 完成時間戳
   - 分配給各治療師的 PPF 金額
```

---

## 4. UI/UX 設計

### 4.1 患者詳情頁面 - 療程區塊

新增「療程歷史」分頁

```
【療程歷史】分頁
├── 現有療程套餐卡片列表
│   每個卡片顯示：
│   - 模板名稱 (e.g., "10次美容套餐")
│   - 進度條 (e.g., 5/10 completed)
│   - 購買日期、總金額、已用點數
│   - 【查看詳情】按鈕
│
└── 療程詳情模態框
    ├── 套餐基本信息
    │   - 模板名稱、購買日期、總金額、實際支付金額
    │
    ├── 分階段顯示 (基礎治療、進階治療、維護)
    │   └── 該階段對應的 sessions 表格
    │
    ├── 表格列：
    │   - 次數 (1-10)
    │   - 預定日期
    │   - 開始時間 / 結束時間
    │   - 完成狀態 (待執行 ⏳ / 已完成 ✅ / 已取消 ❌)
    │   - 治療師
    │   - 【編輯】按鈕
    │
    └── 編輯 Session 模態框
        ├── 預定日期: [日期選擇器]
        ├── 開始時間: [時間選擇器]
        ├── 結束時間: [時間選擇器]
        ├── 完成狀態: [下拉式菜單]
        ├── 治療師分配:
        │   ├── [+ 新增治療師]
        │   ├── 治療師 1 (60%) | 治療師 2 (40%) [移除]
        │   └── (自動驗證百分比 = 100%)
        ├── 治療師備註: [文字框]
        ├── 患者反饋: [文字框]
        └── [保存] [取消]
```

### 4.2 中央療程管理頁面

新增「療程管理」頁面（全院視圖）

```
【療程管理】頁面

左側篩選面板：
├── 患者名稱: [搜尋框]
├── 治療師: [多選 dropdown]
├── 完成狀態: [Pending / Completed / Cancelled]
├── 日期範圍: [日期選擇器]
└── 【篩選】【重置】按鈕

主區域 - 療程卡片列表：
┌──────────────────────────────────┐
│ 患者名稱 (性別, 年齡)             │
│ 療程進度: 5/10 ████░░░░░░         │
│ 模板: 10次美容套餐                 │
│ 最近一次: 2024/2/22 10:00 ✅      │
│ 下次預定: 2024/3/1 10:00 ⏳       │
│ 治療師: 醫生 (60%), 護理師 (40%)  │
│ 【編輯】【查看詳情】【取消療程】   │
└──────────────────────────────────┘
```

---

## 5. 系統集成

### 5.1 與 Points 系統的集成

```
建立療程套餐時：
- 檢查患者可用點數餘額
- 如患者同意抵扣 → 調用 PointsService.redeemPoints()
- 創建 PointsTransaction 記錄

完成 session 時：
- 無需額外操作（points 在購買時已處理）
- 但需要確保 actualPayment 正確（= purchaseAmount - redeemed）
```

### 5.2 與 Referrals 系統的集成

```
完成首次療程時（sessionNumber = 1）：
- 如患者是通過推薦進來的
- 發送 'treatment.session1.completed' 事件
- ReferralEventListener 監聽此事件
- 檢查推薦記錄並可能觸發額外獎勵（如適用）
```

### 5.3 新增事件

```
'session.completed' 事件
- 監聽者：PPFDistributionListener
- 負載：{ sessionId, treatmentCourseId, patientId, staffAssignments }
- 作用：創建 PPFDistribution 記錄，更新治療師點數/佣金
```

---

## 6. 後端 API 端點

### 6.1 課程模板管理

```
GET    /treatment-course-templates
       查詢所有可用模板

GET    /treatment-course-templates/:id
       查詢特定模板詳情
```

### 6.2 患者療程管理

```
POST   /treatment-courses
       為患者建立新療程套餐
       Body: { patientId, templateId, pointsToRedeem? }

GET    /patients/:patientId/treatment-courses
       查詢患者的所有療程套餐

GET    /treatment-courses/:courseId
       查詢特定療程套餐詳情

PUT    /treatment-courses/:courseId
       更新療程套餐（例如改為 abandoned）
```

### 6.3 單次療程管理

```
GET    /treatment-sessions/:sessionId
       查詢單次療程詳情

PUT    /treatment-sessions/:sessionId
       更新單次療程（時間戳、完成狀態、備註等）
       Body: { actualStartTime, actualEndTime, completionStatus, therapistNotes, patientFeedback, staffAssignments[] }

DELETE /treatment-sessions/:sessionId
       取消單次療程
```

### 6.4 治療師視圖

```
GET    /staff/:staffId/treatment-sessions
       查詢該治療師的所有療程
       支持篩選：日期範圍、完成狀態等
```

---

## 7. 測試策略

### 7.1 單元測試

- `TreatmentCourseTemplateService` - 模板 CRUD
- `TreatmentCourseService` - 套餐管理、購買邏輯
- `TreatmentSessionService` - Session CRUD、狀態轉換
- `PPFCalculationService` - PPF 計算邏輯、百分比驗證

### 7.2 集成測試

- 完整的建立套餐 → 分配治療師 → 完成 session → PPF 分配流程
- Points 抵扣 → 實際支付金額計算 → PPF 計算的正確性
- 多治療師分配的百分比驗證（必須 = 100%）
- 療程完成後觸發事件

### 7.3 E2E 測試

- 患者詳情頁面：建立療程、編輯 session、查看進度
- 中央管理頁面：篩選、搜尋、批量操作
- 治療師視圖：查詢自己的療程列表

---

## 8. 安全性和驗證

### 8.1 多租戶隔離

- 所有查詢都包含 `clinicId` 過濾
- API 端點驗證用戶所屬的 `clinicId`
- 防止患者/治療師跨診所數據洩露

### 8.2 關鍵驗證規則

建立療程套餐時：
- ✓ 患者必須存在
- ✓ 模板必須存在且有效
- ✓ `clinicId` 一致性檢查

完成療程 session 時：
- ✓ Session 必須處於 `pending` 狀態
- ✓ 治療師分配的 PPF 百分比必須等於 100%
- ✓ 多租戶隔離驗證
- ✓ 不允許重複完成同一 session

Points 抵扣時：
- ✓ 患者點數餘額 >= 所需抵扣點數
- ✓ 計算後的金額必須 > 0（不能全額抵扣）

---

## 9. 實施順序（Phase 優先級）

1. **後端 Entities 和 DTOs** - 數據模型定義
2. **後端 Services** - 業務邏輯實現（PPF 計算、驗證）
3. **後端 Controllers 和 Events** - API 端點和事件監聽
4. **前端 - 患者詳情頁面** - 療程追蹤 UI
5. **前端 - 中央管理頁面** - 療程管理 UI
6. **整合測試** - 完整流程驗證

---

**設計完成日期**: 2026-02-12
**下一步**: 創建詳細的實施計畫和任務分解

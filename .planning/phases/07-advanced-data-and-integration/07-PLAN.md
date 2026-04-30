# 實作計畫：Phase 7 - 高級數據分析與整合擴展

## 1. 目標與背景 (Objective & Background)
在 Phase 5 與 Phase 6 中，我們成功將系統推進至生產級架構，引入了 JSONB 動態屬性系統、全局診所隔離，並重構了核心的業務與分潤流程。Phase 7 將在此堅實的基礎上，解鎖系統的高階價值，主要包含三個戰略方向：

1.  **動態欄位擴展 (Dynamic Field Extensions)**：滿足診所更多樣化的資料收集需求。
2.  **高級數據分析 (Advanced Data Analytics)**：利用 PostgreSQL JSONB 的強大查詢能力，從自定義欄位中挖掘商業價值。
3.  **自動化對帳 (Automated Reconciliation)**：確保雙系統 (CRM 與 Dr. Toolbox) 在長時間運行下的數據一致性。

## 2. 範圍與影響 (Scope & Impact)

### 2.1 動態欄位擴展 (方案 C)
*   **目標**：擴充 `DynamicFieldRenderer.vue` 與後端驗證邏輯，支援「多選清單 (Multi-select)」、「檔案上傳 (File Upload)」與「日期範圍 (Date Range)」。
*   **影響**：允許診所建立更複雜的病歷表單與患者問卷。

### 2.2 高級數據分析 (方案 A)
*   **目標**：建立針對 `customFields` 的聚合查詢 API，並在前端提供視覺化報表。
*   **影響**：診所可依據自定義指標（如：特定皮膚類型的療程轉化率、不同年齡層的客單價）進行交叉分析。

### 2.3 自動化對帳 (方案 B)
*   **目標**：擴展 `SyncMonitoringService`，實作每日凌晨執行的對帳任務 (Cron Job)。
*   **影響**：自動比對 CRM 與 Toolbox 的關鍵數據（如患者總數、近期異動記錄），產生差異報告，並嘗試自動修復不一致（以 CRM 為主）。

## 3. 分階段實作計畫 (Implementation Plan)

### 第一階段：動態欄位 UI 擴充與後端驗證
1.  **實體更新**：修改 `AttributeDefinition` 以支援新的 `dataType` (`multiselect`, `file`, `daterange`)。
2.  **前端組件**：升級 `DynamicFieldRenderer.vue`，整合 Naive UI 的 `NSelect` (multiple)、`NUpload` 與 `NDatePicker`。
3.  **後端邏輯**：在 `AttributeValidationService` 中加入新資料型別的驗證規則（例如：確保 multiselect 的值是陣列且在選項內）。

### 第二階段：JSONB 聚合分析 API
1.  **後端查詢**：利用 TypeORM QueryBuilder 與 PostgreSQL 特有的 JSONB 運算子 (`->>`, `@>`)，建立 `AnalyticsService`。
2.  **API 設計**：實作 `POST /analytics/custom-fields`，允許前端傳入動態的 groupBy 與 filter 條件。
3.  **前端視覺化**：在 `PatientDashboard.vue` 或新增的 `AnalyticsView.vue` 中，利用 ECharts 呈現動態圖表。

### 第三階段：自動化對帳與修正機制
1.  **排程任務**：在 `SyncMonitoringService` 中註冊 `@Cron(CronExpression.EVERY_DAY_AT_3AM)`。
2.  **對帳邏輯**：
    *   計算前一日 CRM 有異動的患者清單的 Hash 值。
    *   透過 API 向 Toolbox 請求對應患者的 Hash 值進行比對。
    *   找出差異，記錄至 `ReconciliationReport` 實體。
3.  **自動修復**：針對有差異的記錄，自動觸發一次單向強制同步 (`CRM -> Toolbox`)。

## 4. 驗證與測試 (Verification)
*   **動態欄位**：建立包含多選與檔案上傳的自定義欄位，並成功保存與讀取。
*   **數據分析**：執行含有 JSONB 條件的聚合查詢，確認 PostgreSQL 執行計畫 (EXPLAIN) 是否有效利用了 GIN 索引。
*   **自動對帳**：模擬修改 Toolbox 端的資料製造差異，手動觸發對帳腳本，驗證系統能否正確揪出差異並自動覆蓋還原。

## 5. 部署與回復策略 (Migration & Rollback)
*   **Migration**：新增 `ReconciliationReport` 實體需要產生新的資料庫遷移檔。
*   **Rollback**：若對帳邏輯造成過大伺服器負載，可透過環境變數 `ENABLE_DAILY_RECONCILIATION=false` 快速關閉排程任務。

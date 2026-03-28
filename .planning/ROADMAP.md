# 路線圖：Doctor CRM

**版本：** 1.0
**建立日期：** 2026-03-26
**核心目標：** 建立完整的自費醫療療程管理系統，含財務追蹤與患者通知

## 階段概觀

| # | 階段名 | 目標 | 需求 | 成功標準 |
|---|--------|------|------|---------|
| 1 | 13/13 | Complete   | 2026-03-27 | 醫護人員能完整管理療程/醫令，患者能查看進度 |
| 2 | 3/3 | Complete   | 2026-03-27 | 患者在關鍵節點（開始/進度/完成）收到通知 |
| 3 | 2/3 | In Progress|  | 醫護人員能準確追蹤費用，患者收到清晰發票 |
| 4 | Doctor Toolbox 整合 | 實現與 Doctor Toolbox 雙向同步 | INTEGRATION-01~04 | 兩系統資料一致，以身份證ID+姓名索引 |

## Phase 1：療程與醫令核心（約 3-4 週）

**計劃進度：**

| 計劃 | 名稱 | 狀態 | 提交 |
|------|------|------|------|
| 01 | 11/13 | Complete    | 2026-03-27 |
| 02 | TreatmentProgressService + 醫護分配 | Complete    | 2026-03-27 |
| 03 | PatientSearch 實體與搜尋服務 | ✓ 完成 | 20143af4 |
| 04 | MedicalOrderController 醫令 API | ✓ 完成 | 2cf1405d |
| 05 | TreatmentCourse CRUD API | ✓ 完成 | 9eeb169d |
| 06 | PatientController 患者 API | ✓ 完成 | 98dd91d4 |
| 07 | DTO 驗證層與 ValidationErrorFilter | ✓ 完成 | 00b37172 |
| 08-13 | 後續計劃 | ○ 待處理 | - |

**交付內容：**
- 療程創建/編輯/刪除完整流程
- 醫令管理與使用狀態追蹤
- 患者療程進度可視化
- 患者身份證ID + 姓名索引優化

**技術重點：**
- 優化 TreatmentController 與 TreatmentSessionController
- 改進 ScriptTemplate 的使用狀態管理
- 增強患者搜尋索引

**必達指標：**
- ✓ 療程 CRUD 操作無誤差
- ✓ 療程進度準確反映
- ✓ 患者能快速查詢自己的療程
- ✓ 90% 測試覆蓋率

---

## Phase 2：患者通知系統（約 2-3 週）

**交付內容：**
- 通知系統基礎架構
- 多渠道通知（郵件、簡訊、應用內）
- 療程生命週期事件觸發通知
- 患者通知偏好設定

**技術重點：**
- 使用 NestJS Event Emitter 觸發通知
- 整合郵件服務（nodemailer）
- 整合簡訊服務（待選擇）
- 前端通知 UI 組件

**必達指標：**
- ✓ 關鍵事件都有通知
- ✓ 多渠道發送無故障
- ✓ 患者收到率 > 95%

---

## Phase 3：財務管理完善（約 3-4 週）

**計劃數：** 3 個計劃

**計劃進度：**

| 計劃 | 名稱 | 狀態 | 提交 |
|------|------|------|------|
| 01 | Payment 實體、FeeCalculationService 與 PaymentController（FIN-01/02/05） | ○ 待處理 | - |
| 02 | Invoice 實體、InvoiceService 與 InvoiceController（FIN-03/04） | ○ 待處理 | - |
| 03 | RevenueReportService 報表 API 與前端 ECharts 視覺化（FIN-06） | ○ 待處理 | - |

計劃清單：
- [ ] 03-01-PLAN.md — Payment 實體與費用計算服務基礎
- [ ] 03-02-PLAN.md — 發票生成與管理系統
- [ ] 03-03-PLAN.md — 收入統計報表與前端視覺化

**交付內容：**
- Payment 實體（患者支付記錄，三種付款方式）
- FeeCalculationService（Decimal.js 精確計算，誤差 < 0.01%）
- Invoice 實體（自動流水號，draft/issued/cancelled 狀態流）
- InvoiceService（重複開立防護，費用明細自動生成）
- RevenueReportService（聚合查詢：月趨勢、支付方式、人員分潤）
- 前端報表分頁（ECharts 長條圖 + 環形圖 + 人員表格）

**技術重點：**
- 改進現有 Revenue 模組，新增 Payment + Invoice 實體
- 使用 decimal.js 進行精確財務計算
- TypeORM QueryBuilder 聚合查詢（月趨勢 SQLite strftime）
- ECharts 6.0 + vue-echarts 視覺化

**必達指標：**
- ✓ 費用計算誤差 < 0.01%
- ✓ 發票格式符合台灣稅務要求（invoiceNumber: INV-{YYYYMM}-{序號}）
- ✓ 報表載入時間 < 2 秒

---

## Phase 4：Doctor Toolbox 整合（約 4-5 週）

**交付內容：**
- Doctor Toolbox API 對接
- 資料同步機制（雙向實時）
- 身份證ID + 姓名唯一索引
- 衝突解決策略

**技術重點：**
- 設計 Webhook 或 Polling 同步機制
- 實現事務一致性
- 資料驗證與轉換層
- 同步失敗重試邏輯

**必達指標：**
- ✓ 同步延遲 < 5 秒
- ✓ 資料一致性 99.9%
- ✓ 沒有重複或遺漏記錄

---

## 里程碑

| 里程碑 | 目標日期 | 成果 |
|--------|---------|------|
| Phase 1 完成 | 2026-04-23 | 療程/醫令管理生產就緒 |
| Phase 2 完成 | 2026-05-21 | 患者通知全面上線 |
| Phase 3 完成 | 2026-06-18 | 財務管理完整功能 |
| Phase 4 完成 | 2026-07-23 | Doctor Toolbox 整合上線 |
| **v1.0 發佈** | **2026-07-23** | **完整的自費醫療管理平台** |

---

*路線圖建立日期：2026-03-26*
*最後更新：2026-03-27（Phase 3 計劃建立）*

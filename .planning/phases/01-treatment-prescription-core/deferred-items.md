# 延遲項目（Deferred Items）

## 計劃 07 執行期間發現的現有問題

以下為預先存在的 TypeScript 建構錯誤，與計劃 07 的變更無關：

1. `src/patients/controllers/patient.controller.ts:124` - PatientService 缺少 `createPatient` 方法
2. `src/patients/controllers/patient.controller.ts:147` - PatientService 缺少 `updatePatient` 方法
3. `src/treatments/entities/treatment.entity.ts:24` - Patient 實體缺少 `treatments` 屬性
4. `src/treatments/services/medical-order.service.ts:101,118,121` - MedicalOrder 實體/服務類型不符

這些問題應在後續計劃中修復（可能在計劃 04-06 的實作範圍內）。

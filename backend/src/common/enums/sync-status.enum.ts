/**
 * 同步狀態列舉
 *
 * 追蹤患者同步的生命週期狀態
 */
export enum SyncStatus {
  /**
   * 待同步
   * Webhook 收到但尚未處理同步
   */
  PENDING = 'pending',

  /**
   * 已同步
   * 患者資料已成功同步到 CRM
   */
  SYNCED = 'synced',

  /**
   * 衝突偵測
   * CRM 和 Doctor Toolbox 的資料產生衝突
   * 需人工審查或自動解決（CRM 為主）
   */
  CONFLICT = 'conflict',

  /**
   * 同步失敗
   * 同步過程中發生錯誤（網路、驗證、資料問題等）
   * 錯誤訊息記錄在 SyncPatientIndex.errorMessage
   */
  FAILED = 'failed',
}

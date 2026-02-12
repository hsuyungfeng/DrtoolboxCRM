/**
 * 標準 API 錯誤響應接口
 */
export interface ApiErrorResponse {
  /**
   * HTTP 狀態碼
   */
  statusCode: number;

  /**
   * 錯誤信息
   */
  message: string;

  /**
   * 錯誤代碼，用於前端識別錯誤類型
   */
  errorCode: string;

  /**
   * 錯誤發生的時間戳
   */
  timestamp: string;

  /**
   * 請求路徑
   */
  path?: string;

  /**
   * 錯誤詳細信息
   */
  details?: Record<string, any>;

  /**
   * 驗證錯誤列表（僅在驗證錯誤時存在）
   */
  errors?: Array<{
    field: string;
    message: string;
    constraint?: string;
  }>;
}
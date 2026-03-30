import { Injectable, Logger } from '@nestjs/common';

/**
 * RetryService - 指數退避重試邏輯
 *
 * 功能：
 * - 執行非同步操作，在失敗時進行自動重試
 * - 實現指數退避（exponential backoff）
 * - 預設 4 次嘗試（初始 1 次 + 3 次重試），可配置
 *
 * 設計：
 * - 延遲時序：[2000, 4000, 8000, 16000] 毫秒（2s, 4s, 8s, 16s）
 * - 嘗試 1：無延遲（立即執行）
 * - 嘗試 2-5：應用對應的延遲值，然後重試
 * - 所有嘗試都失敗後，拋出最後一個錯誤
 *
 * 用途：
 * - 包裝 Toolbox API 呼叫 (SyncPatientService.pushPatientToToolbox)
 * - 處理瞬時網路故障（transient network failures）
 * - 無訊息佇列依賴，純粹基於 async/await
 */
@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  /**
   * 延遲時序（毫秒）
   * - 指數退避：2s → 4s → 8s → 16s
   * - 索引對應嘗試編號（attempt 1 後的延遲）
   */
  private readonly backoffDelays: number[] = [2000, 4000, 8000, 16000];

  /**
   * 使用指數退避重試執行非同步函式
   *
   * @param fn 待執行的非同步函式，必須返回 Promise<T>
   * @param maxAttempts 最大嘗試次數，預設 4 (1 + 3 次重試)
   * @returns 函式執行的結果 (T)
   * @throws 若所有嘗試都失敗，拋出最後一個錯誤
   *
   * 範例：
   *   const result = await retryService.executeWithRetry(
   *     async () => await fetch(url, {...}),
   *     4
   *   );
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 4,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // 執行函式
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // 若非最後一次嘗試，應用延遲後重試
        if (attempt < maxAttempts - 1) {
          const delayMs = this.backoffDelays[attempt];
          this.logger.warn(
            `嘗試 ${attempt + 1} 失敗，將在 ${delayMs}ms 後進行第 ${attempt + 2} 次重試。錯誤：${lastError.message}`,
          );
          await this.delay(delayMs);
        } else {
          // 最後一次嘗試失敗，記錄警告並準備拋出
          this.logger.error(
            `嘗試 ${attempt + 1} 失敗，所有 ${maxAttempts} 次嘗試都已用盡。錯誤：${lastError.message}`,
          );
        }
      }
    }

    // 所有嘗試都失敗，拋出最後的錯誤
    throw lastError;
  }

  /**
   * 延遲執行（私有助手）
   *
   * @param ms 延遲毫秒數
   * @returns Promise，在指定時間後 resolve
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), ms);
    });
  }
}

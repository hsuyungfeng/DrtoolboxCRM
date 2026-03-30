import { Test, TestingModule } from '@nestjs/testing';
import { RetryService } from '../services/retry.service';

describe('RetryService', () => {
  let service: RetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetryService],
    }).compile();

    service = module.get<RetryService>(RetryService);
  });

  it('應該被定義', () => {
    expect(service).toBeDefined();
  });

  describe('executeWithRetry', () => {
    /**
     * 測試場景 1：首次嘗試成功
     * 預期：無延遲，立即返回結果
     */
    it('應在首次嘗試成功時立即返回結果（無延遲）', async () => {
      const mockFn = jest.fn(async () => 'success');
      const startTime = Date.now();

      const result = await service.executeWithRetry(mockFn, 4);

      const elapsed = Date.now() - startTime;
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      // 首次成功應在 500ms 內完成（允許浮動）
      expect(elapsed).toBeLessThan(500);
    });

    /**
     * 測試場景 2：第一次失敗，第二次成功
     * 預期：延遲 2000ms，共 2 次呼叫
     */
    it('應在首次失敗後、第二次成功時經過約 2s 延遲重試', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Transient failure'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      const result = await service.executeWithRetry(mockFn, 4);
      const elapsed = Date.now() - startTime;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
      // 應約 2000ms，允許 ±200ms 浮動
      expect(elapsed).toBeGreaterThanOrEqual(1800);
      expect(elapsed).toBeLessThan(2300);
    });

    /**
     * 測試場景 3：所有重試都失敗
     * 預期：經過 4 次嘗試（延遲 2 + 4 + 8 = 14s），拋出最後的錯誤
     */
    it(
      '應在所有 4 次嘗試都失敗時拋出最後的錯誤（總延遲 ≥ 14s）',
      async () => {
        const testError = new Error('Permanent failure');
        const mockFn = jest.fn().mockRejectedValue(testError);

        const startTime = Date.now();

        try {
          await service.executeWithRetry(mockFn, 4);
          fail('Should have thrown an error');
        } catch (error) {
          const elapsed = Date.now() - startTime;
          expect((error as Error).message).toBe('Permanent failure');
          expect(mockFn).toHaveBeenCalledTimes(4);
          // 總延遲應為 2000 + 4000 + 8000 = 14000ms（第 4 次嘗試無延遲）
          // 允許 ±500ms 浮動
          expect(elapsed).toBeGreaterThanOrEqual(13500);
          expect(elapsed).toBeLessThan(15000);
        }
      },
      20000,
    );

    /**
     * 測試場景 4：自訂 maxAttempts = 2
     * 預期：僅 2 次嘗試，延遲 2000ms，然後拋出
     */
    it('應支援自訂 maxAttempts（測試 maxAttempts=2）', async () => {
      const testError = new Error('Custom max attempts');
      const mockFn = jest.fn().mockRejectedValue(testError);

      const startTime = Date.now();

      try {
        await service.executeWithRetry(mockFn, 2);
        fail('Should have thrown an error');
      } catch (error) {
        const elapsed = Date.now() - startTime;
        expect((error as Error).message).toBe('Custom max attempts');
        expect(mockFn).toHaveBeenCalledTimes(2);
        // 總延遲應為 2000ms（第 1 次失敗後的延遲）
        // 允許 ±300ms 浮動
        expect(elapsed).toBeGreaterThanOrEqual(1700);
        expect(elapsed).toBeLessThan(2300);
      }
    });

    /**
     * 測試場景 5：型別安全性
     * 預期：支援泛型<T>，正確返回型別
     */
    it('應支援泛型型別，正確返回複雜物件', async () => {
      interface MockData {
        id: string;
        name: string;
        value: number;
      }

      const expectedData: MockData = {
        id: 'test-123',
        name: 'Test Data',
        value: 42,
      };

      const mockFn = jest.fn(async () => expectedData);

      const result = await service.executeWithRetry(mockFn, 4);

      expect(result).toEqual(expectedData);
      expect(result.id).toBe('test-123');
      expect(result.value).toBe(42);
    });

    /**
     * 測試場景 6：多次失敗後成功
     * 預期：失敗 3 次，第 4 次成功，應用正確的延遲序列
     */
    it('應在多次失敗後成功時應用正確的延遲序列（2s + 4s + 8s）', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockRejectedValueOnce(new Error('Fail 3'))
        .mockResolvedValueOnce('success on attempt 4');

      const startTime = Date.now();
      const result = await service.executeWithRetry(mockFn, 4);
      const elapsed = Date.now() - startTime;

      expect(result).toBe('success on attempt 4');
      expect(mockFn).toHaveBeenCalledTimes(4);
      // 總延遲應為 2000 + 4000 + 8000 = 14000ms
      // 允許 ±800ms 浮動（因為涉及多次計時器）
      expect(elapsed).toBeGreaterThanOrEqual(13200);
      expect(elapsed).toBeLessThan(15200);
    }, 20000);

    /**
     * 測試場景 7：預設 maxAttempts (不傳遞參數)
     * 預期：應使用預設值 4
     */
    it('應在未指定 maxAttempts 時使用預設值 4', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Default test'));

      try {
        await service.executeWithRetry(mockFn);
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toBe('Default test');
        expect(mockFn).toHaveBeenCalledTimes(4);
      }
    }, 20000);
  });
});

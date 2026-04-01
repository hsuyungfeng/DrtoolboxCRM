/**
 * TreatmentDetailPage - 療程詳情頁面物件模型
 *
 * 封裝 TreatmentDetail.vue 的操作與驗證方法
 * 包含：基本資訊驗證、進度條驗證、課程完成標記
 *
 * 對應路由：/treatments/:id
 * 對應 API：
 *   - GET   /api/treatments/courses/:id（詳情）
 *   - PATCH /api/treatments/sessions/:id/complete（標記完成）
 */
import { Page, Locator, expect } from '@playwright/test';

export class TreatmentDetailPage {
  readonly page: Page;

  // 頁面主要元素
  readonly backButton: Locator;
  readonly treatmentName: Locator;
  readonly loadingSpinner: Locator;
  readonly notFoundResult: Locator;

  // 統計資訊（NStatistic 元件）
  readonly patientInfo: Locator;
  readonly typeInfo: Locator;
  readonly statusTag: Locator;
  readonly costInfo: Locator;

  // 進度條（TreatmentProgressBar 元件）
  readonly progressSection: Locator;
  readonly progressBar: Locator;
  readonly progressText: Locator;
  readonly progressPercentage: Locator;

  // 課程列表（NList 元件）
  readonly sessionList: Locator;
  readonly sessionItems: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    // 頁面導航
    this.backButton = page.locator('.detail-header button').first();
    this.treatmentName = page.locator('.detail-header h1');
    this.loadingSpinner = page.locator('.n-spin');
    this.notFoundResult = page.locator('.n-result');

    // 統計區塊 — 對應 TreatmentDetail.vue 的 NStatistic
    this.patientInfo = page.locator('.n-statistic').filter({ hasText: '患者' });
    this.typeInfo = page.locator('.n-statistic').filter({ hasText: '類型' });
    this.statusTag = page.locator('.n-statistic').filter({ hasText: '狀態' }).locator('.n-tag');
    this.costInfo = page.locator('.n-statistic').filter({ hasText: '每堂費用' });

    // 進度區塊 — 對應 TreatmentProgressBar.vue
    this.progressSection = page.locator('.progress-section');
    this.progressBar = page.locator('.n-progress');
    this.progressText = page.locator('.progress-info span').first();
    this.progressPercentage = page.locator('.progress-info .percentage');

    // 課程列表 — 對應 NList + NListItem
    this.sessionList = page.locator('.n-list');
    this.sessionItems = page.locator('.n-list-item');
    this.emptyState = page.locator('.n-empty');
  }

  /** 導航到特定療程詳情頁面 */
  async goto(treatmentId: string) {
    await this.page.goto(`/treatments/${treatmentId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /** 等待頁面載入完成 */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  /** 取得療程名稱 */
  async getName(): Promise<string> {
    return (await this.treatmentName.textContent()) || '';
  }

  /** 取得患者名稱 */
  async getPatientName(): Promise<string> {
    return (await this.patientInfo.textContent()) || '';
  }

  /** 取得狀態文字 */
  async getStatus(): Promise<string> {
    return (await this.statusTag.textContent()) || '';
  }

  /** 取得進度文字（例如 "1 / 3 已完成"） */
  async getProgressText(): Promise<string> {
    return (await this.progressText.textContent()) || '';
  }

  /** 取得進度百分比文字（例如 "33%"） */
  async getProgressPercentage(): Promise<string> {
    return (await this.progressPercentage.textContent()) || '';
  }

  /** 取得課程項目數量 */
  async getSessionCount(): Promise<number> {
    return await this.sessionItems.count();
  }

  /**
   * 標記指定課程為完成（點擊 NCheckbox）
   * @param index 課程索引（從 0 開始）
   */
  async completeSession(index: number) {
    const sessionItem = this.sessionItems.nth(index);
    const checkbox = sessionItem.locator('.n-checkbox');
    await checkbox.click();
    // 等待 PATCH API 回應並重新載入
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }

  /**
   * 檢查指定課程是否已完成
   * @param index 課程索引（從 0 開始）
   */
  async isSessionCompleted(index: number): Promise<boolean> {
    const sessionItem = this.sessionItems.nth(index);
    const tag = sessionItem.locator('.n-tag');
    const tagText = await tag.textContent();
    return tagText?.includes('已完成') || false;
  }

  /**
   * 檢查指定課程的 checkbox 是否為禁用狀態
   * @param index 課程索引（從 0 開始）
   */
  async isSessionCheckboxDisabled(index: number): Promise<boolean> {
    const sessionItem = this.sessionItems.nth(index);
    const checkbox = sessionItem.locator('.n-checkbox');
    const classAttr = await checkbox.getAttribute('class');
    return classAttr?.includes('n-checkbox--disabled') || false;
  }

  /** 點擊返回按鈕 */
  async goBack() {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** 擷取畫面截圖 */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `tests/artifacts/${name}.png`,
      fullPage: true,
    });
  }
}

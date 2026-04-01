/**
 * TreatmentListPage - 療程列表頁面物件模型
 *
 * 封裝 TreatmentList.vue 的所有互動操作與斷言方法
 * 此頁面使用 TreatmentForm.vue 元件（NModal preset="card"）
 * 包含：患者遠端搜尋、療程範本選擇、購買療程
 *
 * 對應路由：/treatments
 * 對應 API：
 *   - GET    /api/treatments/courses（列表）
 *   - POST   /api/treatments/courses（建立）
 *   - DELETE /api/treatments/courses/:id（刪除）
 *   - GET    /api/treatments/templates（範本列表）
 *   - GET    /api/patients（患者搜尋）
 */
import { Page, Locator, expect } from '@playwright/test';

export class TreatmentListPage {
  readonly page: Page;

  // 頁面主要元素
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly refreshButton: Locator;
  readonly dataTable: Locator;

  // 建立療程 Modal（NModal preset="card"，標題「購買新療程」）
  readonly createModal: Locator;

  // TreatmentForm 表單元素（在 Modal 內）
  readonly patientSelect: Locator;
  readonly templateSelect: Locator;
  readonly pointsInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // 範本資訊提示（NAlert）
  readonly templateAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    // 頁面結構
    this.pageTitle = page.locator('h1').filter({ hasText: '療程管理' });
    this.createButton = page.locator('button').filter({ hasText: '新增療程' });
    this.refreshButton = page.locator('button').filter({ hasText: '刷新' });
    this.dataTable = page.locator('.n-data-table');

    // Modal（NModal preset="card"，標題為「購買新療程」）
    this.createModal = page.locator('.n-modal, .n-card-header').filter({ hasText: '購買新療程' }).locator('..').locator('..');

    // 表單元素 — 基於 TreatmentForm.vue label
    this.patientSelect = page.locator('.n-form-item').filter({ hasText: '患者' }).locator('.n-select');
    this.templateSelect = page.locator('.n-form-item').filter({ hasText: '療程範本' }).locator('.n-select');
    this.pointsInput = page.locator('.n-form-item').filter({ hasText: '積分抵扣' }).locator('.n-input-number');
    this.saveButton = page.locator('button').filter({ hasText: '購買療程' });
    this.cancelButton = page.locator('.n-modal button, .form-actions button').filter({ hasText: '取消' });

    // 範本資訊提示
    this.templateAlert = page.locator('.n-alert');
  }

  /** 導航到療程管理頁面 */
  async goto() {
    await this.page.goto('/treatments');
    await this.page.waitForLoadState('networkidle');
  }

  /** 等待頁面完全載入 */
  async waitForPageLoad() {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  /** 取得表格資料行數 */
  async getTreatmentCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    const rows = this.page.locator('.n-data-table-tbody tr, .n-data-table tbody tr');
    const count = await rows.count();
    // Naive UI 空表格可能有一個「暫無數據」行
    const emptyRow = this.page.locator('.n-data-table .n-data-table-empty');
    if (await emptyRow.isVisible().catch(() => false)) {
      return 0;
    }
    return count;
  }

  /** 取得指定行的文字內容 */
  async getRowText(index: number): Promise<string> {
    const row = this.page.locator('.n-data-table-tbody tr, .n-data-table tbody tr').nth(index);
    return (await row.textContent()) || '';
  }

  /** 驗證表格中是否包含指定文字 */
  async tableContainsText(text: string): Promise<boolean> {
    const tableText = await this.dataTable.textContent();
    return tableText?.includes(text) || false;
  }

  /** 點擊「新增療程」按鈕，開啟建立 Modal */
  async clickCreate() {
    await this.createButton.click();
    await this.page.waitForTimeout(400);
  }

  /** 點擊「刷新」按鈕 */
  async clickRefresh() {
    await this.refreshButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 在 Modal 中搜尋並選擇患者
   * TreatmentForm 使用的是 NSelect remote filterable
   * @param searchText 搜尋關鍵字（觸發 API 搜尋）
   * @param patientName 要選擇的患者名稱
   */
  async selectPatient(searchText: string, patientName: string) {
    // 點擊患者選擇器
    await this.patientSelect.click();
    await this.page.waitForTimeout(200);

    // 輸入搜尋文字觸發遠端搜尋
    const input = this.patientSelect.locator('input');
    await input.fill(searchText);
    await this.page.waitForTimeout(500); // 等待 API 回應

    // 從下拉選單中選擇
    const option = this.page.locator('.n-base-select-option, .n-select-option').filter({ hasText: patientName });
    await option.first().click();
    await this.page.waitForTimeout(200);
  }

  /**
   * 在 Modal 中選擇療程範本
   * @param templateKeyword 範本名稱關鍵字
   */
  async selectTemplate(templateKeyword: string) {
    await this.templateSelect.click();
    await this.page.waitForTimeout(300);

    const option = this.page.locator('.n-base-select-option, .n-select-option').filter({ hasText: templateKeyword });
    await option.first().click();
    await this.page.waitForTimeout(200);
  }

  /** 填入積分抵扣 */
  async fillPoints(points: number) {
    const input = this.pointsInput.locator('input');
    await input.click();
    await input.fill(points.toString());
  }

  /** 點擊「購買療程」送出表單 */
  async submitForm() {
    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** 點擊「取消」關閉 Modal */
  async cancelForm() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(300);
  }

  /** 點擊指定行的「查看」按鈕 */
  async viewTreatment(index: number) {
    const row = this.page.locator('.n-data-table-tbody tr, .n-data-table tbody tr').nth(index);
    const viewBtn = row.locator('button').filter({ hasText: '查看' });
    await viewBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** 點擊指定行的「刪除」按鈕 */
  async deleteTreatment(index: number) {
    const row = this.page.locator('.n-data-table-tbody tr, .n-data-table tbody tr').nth(index);
    const deleteBtn = row.locator('button').filter({ hasText: '刪除' });
    await deleteBtn.click();
    await this.page.waitForTimeout(300);
  }

  /** 確認刪除對話框 */
  async confirmDelete() {
    const dialog = this.page.locator('.n-dialog');
    const confirmBtn = dialog.locator('button').filter({ hasText: '刪除' });
    await confirmBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** 取消刪除對話框 */
  async cancelDelete() {
    const dialog = this.page.locator('.n-dialog');
    const cancelBtn = dialog.locator('button').filter({ hasText: '取消' });
    await cancelBtn.click();
    await this.page.waitForTimeout(200);
  }

  /** 擷取畫面截圖 */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `tests/artifacts/${name}.png`,
      fullPage: true,
    });
  }
}

/**
 * 療程管理工作流程 E2E 測試
 *
 * 涵蓋完整的療程管理生命週期：
 * 1. 導航至療程管理頁面
 * 2. 從範本建立新的療程套餐（TreatmentForm + TreatmentTemplate 選擇）
 * 3. 驗證療程出現在列表中
 * 4. 進入療程詳情頁面（TreatmentDetail.vue）
 * 5. 標記課程為完成（NCheckbox + PATCH /sessions/:id/complete）
 * 6. 驗證進度條更新（TreatmentProgressBar.vue）
 * 7. 刪除療程
 * 8. 錯誤處理與邊界案例
 *
 * 技術堆疊：Vue 3 + Naive UI + NestJS
 * 使用 API Mock 確保測試穩定性與獨立性
 */
import { test, expect } from '@playwright/test';
import { TreatmentListPage } from '../../pages/TreatmentListPage';
import { TreatmentDetailPage } from '../../pages/TreatmentDetailPage';
import {
  setupTreatmentApiMocks,
  mockTemplates,
  mockTreatments,
  mockPatients,
} from '../../fixtures/api-mocks';

// ============================================================
// 測試套件 1：療程列表頁面基本功能
// ============================================================
test.describe('療程列表頁面 - 基本功能', () => {
  let listPage: TreatmentListPage;

  test.beforeEach(async ({ page }) => {
    await setupTreatmentApiMocks(page);
    listPage = new TreatmentListPage(page);
    await listPage.goto();
  });

  test('應正確載入療程管理頁面標題', async ({ page }) => {
    await listPage.waitForPageLoad();

    // 驗證頁面標題元素
    await expect(listPage.pageTitle).toBeVisible();

    // 驗證瀏覽器標題（router beforeEach 設定）
    await expect(page).toHaveTitle(/療程管理/);

    await listPage.screenshot('01-treatment-list-loaded');
  });

  test('應顯示新增療程與刷新按鈕', async () => {
    await listPage.waitForPageLoad();

    await expect(listPage.createButton).toBeVisible();
    await expect(listPage.createButton).toBeEnabled();
    await expect(listPage.refreshButton).toBeVisible();
    await expect(listPage.refreshButton).toBeEnabled();
  });

  test('應正確載入療程列表資料', async ({ page }) => {
    await listPage.waitForPageLoad();
    await page.waitForTimeout(500);

    // 驗證資料表格存在
    await expect(listPage.dataTable).toBeVisible();

    // 驗證列表中有資料（mock 回傳 3 筆）
    const count = await listPage.getTreatmentCount();
    expect(count).toBeGreaterThanOrEqual(1);

    // 驗證第一筆療程名稱出現在表格中
    const hasData = await listPage.tableContainsText('玻尿酸注射療程');
    expect(hasData).toBe(true);

    await listPage.screenshot('02-treatment-list-with-data');
  });

  test('應顯示療程進度資訊', async ({ page }) => {
    await listPage.waitForPageLoad();
    await page.waitForTimeout(500);

    // 驗證進度欄位顯示格式為 "已完成 / 總數"
    // TreatmentList.vue 渲染格式：`${completed} / ${total}`
    const firstRowText = await listPage.getRowText(0);
    expect(firstRowText).toMatch(/1\s*\/\s*3/);
  });

  test('應顯示療程狀態標籤', async ({ page }) => {
    await listPage.waitForPageLoad();
    await page.waitForTimeout(500);

    // 驗證狀態標籤存在（NTag 元素）
    const tags = page.locator('.n-data-table .n-tag');
    const tagCount = await tags.count();
    expect(tagCount).toBeGreaterThanOrEqual(1);

    // 第一筆療程狀態應為「進行中」（status: in_progress）
    const firstTag = tags.first();
    const tagText = await firstTag.textContent();
    expect(tagText).toMatch(/進行中|待開始/);
  });

  test('刷新按鈕應重新載入資料', async ({ page }) => {
    await listPage.waitForPageLoad();

    // 監聽 API 請求
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/treatments/courses') &&
        resp.request().method() === 'GET',
    );

    // 點擊刷新
    await listPage.clickRefresh();

    // 驗證有發出 API 請求
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });
});

// ============================================================
// 測試套件 2：從範本建立新療程工作流程
// ============================================================
test.describe('建立新療程 - 完整流程', () => {
  let listPage: TreatmentListPage;

  test.beforeEach(async ({ page }) => {
    await setupTreatmentApiMocks(page);
    listPage = new TreatmentListPage(page);
    await listPage.goto();
    await listPage.waitForPageLoad();
  });

  test('點擊新增按鈕應開啟購買療程 Modal', async ({ page }) => {
    await listPage.clickCreate();

    // 驗證 Modal 出現（NModal preset="card"，標題「購買新療程」）
    const modalTitle = page.locator('.n-card-header__main').filter({ hasText: '購買新療程' });
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // 驗證表單元素存在
    await expect(listPage.patientSelect).toBeVisible();
    await expect(listPage.templateSelect).toBeVisible();

    await listPage.screenshot('03-create-modal-opened');
  });

  test('應載入療程範本選項', async ({ page }) => {
    await listPage.clickCreate();
    await page.waitForTimeout(500);

    // 點擊範本下拉選單
    await listPage.templateSelect.click();
    await page.waitForTimeout(500);

    // 驗證範本選項存在
    const options = page.locator('.n-base-select-option, .n-select-option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(1);

    // 驗證包含已知範本名稱
    const optionTexts = await options.allTextContents();
    const hasExpectedTemplate = optionTexts.some(
      (text) =>
        text.includes('玻尿酸') ||
        text.includes('雷射') ||
        text.includes('復健'),
    );
    expect(hasExpectedTemplate).toBe(true);

    await listPage.screenshot('04-template-options');
  });

  test('選擇範本後應顯示範本詳情（NAlert）', async ({ page }) => {
    await listPage.clickCreate();
    await page.waitForTimeout(500);

    // 選擇範本
    await listPage.selectTemplate('玻尿酸');
    await page.waitForTimeout(500);

    // 驗證範本資訊提示區塊出現（NAlert type="info"）
    await expect(listPage.templateAlert).toBeVisible({ timeout: 5000 });

    // 驗證顯示範本資訊
    const infoText = await listPage.templateAlert.textContent();
    expect(infoText).toContain('玻尿酸注射療程');
    expect(infoText).toContain('3');
    expect(infoText).toContain('12000');

    await listPage.screenshot('05-template-info-displayed');
  });

  test('未選擇範本時購買按鈕應為禁用狀態', async ({ page }) => {
    await listPage.clickCreate();
    await page.waitForTimeout(300);

    // TreatmentForm.vue: :disabled="!formData.templateId"
    await expect(listPage.saveButton).toBeDisabled();
  });

  test('完整建立療程流程（從患者搜尋到範本選擇到購買確認）', async ({ page }) => {
    const initialCount = await listPage.getTreatmentCount();

    // 步驟 1：開啟建立對話框
    await listPage.clickCreate();
    const modalTitle = page.locator('.n-card-header__main').filter({ hasText: '購買新療程' });
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // 步驟 2：搜尋並選擇患者（NSelect remote filterable）
    await listPage.selectPatient('陳', '陳大華');
    await listPage.screenshot('06-patient-selected');

    // 步驟 3：選擇療程範本
    await listPage.selectTemplate('復健');
    await page.waitForTimeout(300);
    await listPage.screenshot('07-template-selected');

    // 步驟 4：驗證購買按鈕啟用
    await expect(listPage.saveButton).toBeEnabled();

    // 監聯建立 API 請求
    const createResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/treatments/courses') &&
        resp.request().method() === 'POST',
    );

    // 步驟 5：送出表單
    await listPage.submitForm();

    // 步驟 6：驗證 API 請求成功
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);

    // 步驟 7：驗證成功訊息（message.success('療程已建立')）
    const successMsg = page.locator('.n-message').filter({ hasText: '已建立' });
    await expect(successMsg).toBeVisible({ timeout: 5000 });

    // 步驟 8：驗證列表更新（新療程出現）
    await page.waitForTimeout(500);
    const newCount = await listPage.getTreatmentCount();
    expect(newCount).toBe(initialCount + 1);

    await listPage.screenshot('08-treatment-created-success');
  });

  test('取消建立療程應關閉 Modal 且不影響列表', async ({ page }) => {
    const initialCount = await listPage.getTreatmentCount();

    await listPage.clickCreate();
    const modalTitle = page.locator('.n-card-header__main').filter({ hasText: '購買新療程' });
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // 點擊取消
    await listPage.cancelForm();

    // Modal 應關閉
    await expect(modalTitle).not.toBeVisible({ timeout: 3000 });

    // 列表不應變化
    const afterCount = await listPage.getTreatmentCount();
    expect(afterCount).toBe(initialCount);
  });
});

// ============================================================
// 測試套件 3：療程詳情與課程進度管理
// ============================================================
test.describe('療程詳情 - 課程進度管理', () => {
  let listPage: TreatmentListPage;
  let detailPage: TreatmentDetailPage;

  test.beforeEach(async ({ page }) => {
    await setupTreatmentApiMocks(page);
    listPage = new TreatmentListPage(page);
    detailPage = new TreatmentDetailPage(page);
  });

  test('從列表進入療程詳情頁面', async ({ page }) => {
    await listPage.goto();
    await listPage.waitForPageLoad();
    await page.waitForTimeout(500);

    // 點擊第一筆療程的「查看」按鈕
    await listPage.viewTreatment(0);

    // 驗證已導航到詳情頁面
    await detailPage.waitForLoad();
    const name = await detailPage.getName();
    expect(name).toContain('玻尿酸注射療程');

    await detailPage.screenshot('09-treatment-detail-view');
  });

  test('療程詳情應顯示正確的基本資訊', async () => {
    // 直接導航到已知療程
    await detailPage.goto('course_001');
    await detailPage.waitForLoad();

    // 驗證療程名稱
    await expect(detailPage.treatmentName).toContainText('玻尿酸注射療程');

    // 驗證患者名稱
    const patientText = await detailPage.getPatientName();
    expect(patientText).toContain('王小明');

    // 驗證狀態標籤
    await expect(detailPage.statusTag).toBeVisible();
    const status = await detailPage.getStatus();
    expect(status).toMatch(/進行中/);

    await detailPage.screenshot('10-detail-basic-info');
  });

  test('進度條應正確顯示完成比例', async () => {
    await detailPage.goto('course_001');
    await detailPage.waitForLoad();

    // 驗證進度區塊可見
    await expect(detailPage.progressSection).toBeVisible();
    await expect(detailPage.progressBar).toBeVisible();

    // TreatmentProgressBar 格式：`${completed} / ${total} 已完成`
    const progressText = await detailPage.getProgressText();
    expect(progressText).toMatch(/1\s*\/\s*3\s*已完成/);

    // 百分比：Math.round(1/3 * 100) = 33
    const percentage = await detailPage.getProgressPercentage();
    expect(percentage).toContain('33');

    await detailPage.screenshot('11-progress-bar');
  });

  test('應列出所有課程項目', async () => {
    await detailPage.goto('course_001');
    await detailPage.waitForLoad();

    // 驗證課程列表存在（NList）
    await expect(detailPage.sessionList).toBeVisible();

    // 應有 3 個課程（玻尿酸療程共 3 堂）
    const sessionCount = await detailPage.getSessionCount();
    expect(sessionCount).toBe(3);

    // 第一個課程應已完成
    const isFirstCompleted = await detailPage.isSessionCompleted(0);
    expect(isFirstCompleted).toBe(true);

    // 第二個課程應未完成
    const isSecondCompleted = await detailPage.isSessionCompleted(1);
    expect(isSecondCompleted).toBe(false);

    await detailPage.screenshot('12-session-list');
  });

  test('標記課程為完成並更新進度', async ({ page }) => {
    await detailPage.goto('course_001');
    await detailPage.waitForLoad();

    // 紀錄初始進度
    const initialProgress = await detailPage.getProgressText();
    expect(initialProgress).toMatch(/1\s*\/\s*3/);

    // 監聽完成 API 請求（PATCH /sessions/:id/complete）
    const completePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/sessions/') &&
        resp.url().includes('/complete'),
    );

    // 點擊第二個課程的 checkbox 標記完成
    await detailPage.completeSession(1);

    // 驗證 API 請求
    const completeResponse = await completePromise;
    expect(completeResponse.status()).toBe(200);

    // 驗證成功訊息（message.success('課程已標記為完成')）
    const successMsg = page.locator('.n-message').filter({ hasText: '完成' });
    await expect(successMsg).toBeVisible({ timeout: 5000 });

    // 驗證進度已更新（2/3）
    await page.waitForTimeout(500);
    const updatedProgress = await detailPage.getProgressText();
    expect(updatedProgress).toMatch(/2\s*\/\s*3/);

    // 驗證百分比更新（67%）
    const updatedPercentage = await detailPage.getProgressPercentage();
    expect(updatedPercentage).toContain('67');

    await detailPage.screenshot('13-session-completed');
  });

  test('已完成的課程 checkbox 應為禁用狀態', async () => {
    await detailPage.goto('course_001');
    await detailPage.waitForLoad();

    // 第一個課程已完成，其 checkbox 應為 disabled
    // TreatmentDetail.vue: :disabled="session.completionStatus === 'completed'"
    const isDisabled = await detailPage.isSessionCheckboxDisabled(0);
    expect(isDisabled).toBe(true);
  });

  test('返回按鈕應導回療程列表', async ({ page }) => {
    // 先到列表頁
    await listPage.goto();
    await listPage.waitForPageLoad();
    await page.waitForTimeout(500);

    // 進入詳情頁
    await listPage.viewTreatment(0);
    await detailPage.waitForLoad();

    // 點擊返回
    await detailPage.goBack();

    // 應回到列表頁
    await expect(page).toHaveURL(/\/treatments/);
  });
});

// ============================================================
// 測試套件 4：刪除療程
// ============================================================
test.describe('療程刪除功能', () => {
  let listPage: TreatmentListPage;

  test.beforeEach(async ({ page }) => {
    await setupTreatmentApiMocks(page);
    listPage = new TreatmentListPage(page);
    await listPage.goto();
    await listPage.waitForPageLoad();
    await page.waitForTimeout(500);
  });

  test('刪除療程應顯示確認對話框', async ({ page }) => {
    await listPage.deleteTreatment(0);

    // 驗證確認對話框出現（dialog.warning）
    const dialog = page.locator('.n-dialog');
    await expect(dialog).toBeVisible();

    // 驗證對話框內容（對應 TreatmentList.vue handleDelete）
    const dialogText = await dialog.textContent();
    expect(dialogText).toContain('確認刪除');
    expect(dialogText).toContain('無法撤銷');

    await listPage.screenshot('14-delete-confirmation');
  });

  test('確認刪除應移除療程', async ({ page }) => {
    const initialCount = await listPage.getTreatmentCount();

    // 點擊刪除
    await listPage.deleteTreatment(0);

    // 監聽 DELETE API 請求
    const deletePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/treatments/courses/') &&
        resp.request().method() === 'DELETE',
    );

    // 確認刪除
    await listPage.confirmDelete();

    // 驗證 API 請求
    const deleteResponse = await deletePromise;
    expect(deleteResponse.status()).toBe(200);

    // 驗證成功訊息（message.success('療程已刪除')）
    const successMsg = page.locator('.n-message').filter({ hasText: '已刪除' });
    await expect(successMsg).toBeVisible({ timeout: 5000 });

    // 驗證列表更新
    await page.waitForTimeout(500);
    const newCount = await listPage.getTreatmentCount();
    expect(newCount).toBe(initialCount - 1);

    await listPage.screenshot('15-treatment-deleted');
  });

  test('取消刪除不應影響列表', async () => {
    const initialCount = await listPage.getTreatmentCount();

    await listPage.deleteTreatment(0);
    await listPage.cancelDelete();

    const afterCount = await listPage.getTreatmentCount();
    expect(afterCount).toBe(initialCount);
  });
});

// ============================================================
// 測試套件 5：錯誤處理與邊界案例
// ============================================================
test.describe('錯誤處理與邊界案例', () => {
  test('API 錯誤時應顯示錯誤訊息', async ({ page }) => {
    // 設定 API 回傳錯誤
    await page.route('**/api/treatments/courses', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: '伺服器錯誤' }),
        });
      }
    });

    const listPage = new TreatmentListPage(page);
    await listPage.goto();

    // 應顯示錯誤訊息（message.error('載入療程失敗')）
    const errorMsg = page.locator('.n-message').filter({ hasText: '失敗' });
    await expect(errorMsg).toBeVisible({ timeout: 5000 });

    await listPage.screenshot('16-api-error');
  });

  test('療程不存在時應顯示 404 頁面', async ({ page }) => {
    // Mock 回傳 404
    await page.route('**/api/treatments/courses/nonexistent*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: '療程不存在' }),
      });
    });

    const detailPage = new TreatmentDetailPage(page);
    await detailPage.goto('nonexistent');
    await detailPage.waitForLoad();

    // TreatmentDetail.vue: <n-result status="404" title="療程不存在">
    await expect(detailPage.notFoundResult).toBeVisible();

    await detailPage.screenshot('17-not-found');
  });

  test('空列表應正確顯示（無療程資料）', async ({ page }) => {
    // Mock 回傳空陣列
    await page.route('**/api/treatments/courses', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });
    // 同時 mock templates 以避免未處理的請求
    await page.route('**/api/treatments/templates*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    const listPage = new TreatmentListPage(page);
    await listPage.goto();
    await listPage.waitForPageLoad();

    // 表格應存在但無資料列
    await expect(listPage.dataTable).toBeVisible();
    const count = await listPage.getTreatmentCount();
    expect(count).toBe(0);

    await listPage.screenshot('18-empty-list');
  });

  test('建立療程時表單驗證應攔截空白提交', async ({ page }) => {
    await setupTreatmentApiMocks(page);
    const listPage = new TreatmentListPage(page);
    await listPage.goto();
    await listPage.waitForPageLoad();

    // 開啟建立對話框
    await listPage.clickCreate();
    await page.waitForTimeout(500);

    // 購買按鈕在未選範本時應為禁用
    await expect(listPage.saveButton).toBeDisabled();

    await listPage.screenshot('19-form-validation');
  });
});

// ============================================================
// 測試套件 6：響應式設計驗證
// ============================================================
test.describe('響應式設計 - 桌面與平板', () => {
  test('療程列表在桌面解析度下應正確顯示', async ({ page }) => {
    await setupTreatmentApiMocks(page);
    await page.setViewportSize({ width: 1920, height: 1080 });

    const listPage = new TreatmentListPage(page);
    await listPage.goto();
    await listPage.waitForPageLoad();

    await expect(listPage.dataTable).toBeVisible();

    // 頁面佈局應正確：標題與按鈕在同一行
    const header = page.locator('.page-header');
    await expect(header).toBeVisible();

    await listPage.screenshot('20-desktop-layout');
  });

  test('療程列表在平板解析度下應正確顯示', async ({ page }) => {
    await setupTreatmentApiMocks(page);
    await page.setViewportSize({ width: 768, height: 1024 });

    const listPage = new TreatmentListPage(page);
    await listPage.goto();
    await listPage.waitForPageLoad();

    await expect(listPage.dataTable).toBeVisible();
    await expect(listPage.createButton).toBeVisible();

    await listPage.screenshot('21-tablet-layout');
  });
});

// ============================================================
// 測試套件 7：完整端對端工作流程（整合測試）
// ============================================================
test.describe('完整療程管理工作流程', () => {
  test('從建立到完成的完整療程生命週期', async ({ page }) => {
    await setupTreatmentApiMocks(page);
    const listPage = new TreatmentListPage(page);
    const detailPage = new TreatmentDetailPage(page);

    // === 步驟 1：導航到療程列表 ===
    await listPage.goto();
    await listPage.waitForPageLoad();
    await page.waitForTimeout(500);
    const initialCount = await listPage.getTreatmentCount();
    expect(initialCount).toBe(3); // mock 有 3 筆初始資料
    await listPage.screenshot('e2e-01-initial-list');

    // === 步驟 2：建立新療程 ===
    await listPage.clickCreate();
    const modalTitle = page.locator('.n-card-header__main').filter({ hasText: '購買新療程' });
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // 搜尋並選擇患者
    await listPage.selectPatient('李', '李美玲');

    // 選擇療程範本
    await listPage.selectTemplate('雷射');
    await page.waitForTimeout(300);

    // 驗證範本資訊顯示
    await expect(listPage.templateAlert).toBeVisible({ timeout: 5000 });
    const alertText = await listPage.templateAlert.textContent();
    expect(alertText).toContain('雷射除斑療程');

    await listPage.screenshot('e2e-02-form-filled');

    // 送出
    const createPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/treatments/courses') &&
        resp.request().method() === 'POST',
    );
    await listPage.submitForm();
    const createResp = await createPromise;
    expect(createResp.status()).toBe(201);

    // 驗證列表更新
    await page.waitForTimeout(500);
    const afterCreateCount = await listPage.getTreatmentCount();
    expect(afterCreateCount).toBe(initialCount + 1);
    await listPage.screenshot('e2e-03-after-create');

    // === 步驟 3：進入第一筆療程的詳情 ===
    await listPage.viewTreatment(0);
    await detailPage.waitForLoad();

    // 驗證詳情頁面
    const name = await detailPage.getName();
    expect(name).toContain('玻尿酸注射療程');
    await detailPage.screenshot('e2e-04-detail-view');

    // === 步驟 4：驗證課程列表 ===
    const sessionCount = await detailPage.getSessionCount();
    expect(sessionCount).toBe(3); // 玻尿酸療程有 3 堂

    // 驗證初始進度（1/3）
    const initialProgress = await detailPage.getProgressText();
    expect(initialProgress).toMatch(/1\s*\/\s*3/);

    // === 步驟 5：標記第二堂課程完成 ===
    const completePromise = page.waitForResponse(
      (resp) => resp.url().includes('/complete'),
    );
    await detailPage.completeSession(1);
    const completeResp = await completePromise;
    expect(completeResp.status()).toBe(200);

    // 驗證進度更新（2/3）
    await page.waitForTimeout(500);
    const updatedProgress = await detailPage.getProgressText();
    expect(updatedProgress).toMatch(/2\s*\/\s*3/);

    const updatedPercentage = await detailPage.getProgressPercentage();
    expect(updatedPercentage).toContain('67');

    await detailPage.screenshot('e2e-05-session-completed');

    // === 步驟 6：返回列表 ===
    await detailPage.goBack();
    await expect(page).toHaveURL(/\/treatments/);

    await listPage.screenshot('e2e-06-workflow-complete');
  });
});

import { test, expect } from '@playwright/test';

test.describe('Doctor CRM E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('首頁儀表板正確載入', async ({ page }) => {
    await expect(page).toHaveTitle(/Doctor CRM/);
    await expect(page.locator('h1')).toContainText('Doctor CRM 儀表板');
    
    await expect(page.locator('.n-statistic').first()).toBeVisible();
    await expect(page.locator('.n-card').filter({ hasText: '患者管理' })).toBeVisible();
    await expect(page.locator('.n-card').filter({ hasText: '療程管理' })).toBeVisible();
    await expect(page.locator('.n-card').filter({ hasText: '分潤管理' })).toBeVisible();
  });

  test('導航到患者管理頁面', async ({ page }) => {
    await page.click('text=進入患者管理');
    await expect(page).toHaveURL(/.*patients/);
    await expect(page.locator('h1')).toContainText('患者管理');
  });

  test('導航到療程管理頁面', async ({ page }) => {
    await page.click('text=進入療程管理');
    await expect(page).toHaveURL(/.*treatments/);
    await expect(page.locator('h1')).toContainText('療程管理');
  });

  test('導航到分潤管理頁面', async ({ page }) => {
    await page.click('text=進入分潤管理');
    await expect(page).toHaveURL(/.*revenue/);
    await expect(page.locator('h1')).toContainText('分潤管理');
  });

  test('分潤試算功能', async ({ page }) => {
    await page.goto('/revenue');
    await page.click('text=分潤試算');
    
    await expect(page.locator('text=即時分潤試算')).toBeVisible();
    
    await page.fill('input[placeholder="請輸入療程金額"]', '10000');
    await page.click('text=開始試算');
    
    await expect(page.locator('text=試算結果')).toBeVisible();
  });
});

test.describe('認證流程', () => {
  test('訪問需要認證的頁面應重新導向登入', async ({ page }) => {
    await page.goto('/patients');
    await expect(page.locator('input[type="text"], input[type="email"]').first()).toBeVisible({ timeout: 10000 });
  });
});

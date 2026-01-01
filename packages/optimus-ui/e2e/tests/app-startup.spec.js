// packages/optimus-ui/e2e/tests/app-startup.spec.js
import { test, expect } from '@playwright/test';

test.describe('前端应用启动测试', () => {
  test('应该能够访问前端应用首页', async ({ page }) => {
    // 访问首页
    await page.goto('/');

    // 验证页面加载成功
    await expect(page).toHaveURL(/\//);

    // 验证页面标题或关键元素存在
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    console.log('✓ 前端应用首页访问成功');
  });

  test('应该能够看到登录表单', async ({ page }) => {
    // 访问首页
    await page.goto('/');

    // 等待登录表单加载 - 使用 data-testid
    await page.waitForSelector('[data-testid="login-submit-button"]', { timeout: 15000 });

    // 验证登录表单元素
    const accountInput = page.locator('[data-testid="login-account-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const submitButton = page.locator('[data-testid="login-submit-button"]');

    await expect(accountInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    console.log('✓ 登录表单元素验证成功');
  });
});

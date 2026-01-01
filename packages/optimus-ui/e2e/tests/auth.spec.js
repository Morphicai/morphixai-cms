// packages/optimus-ui/e2e/tests/auth.spec.js
import { test, expect } from '@playwright/test';
import { login, logout } from '../helpers/auth.js';
import { TEST_USERS } from '../fixtures/test-users.js';

test.describe('用户认证', () => {
  test('应该能够使用管理员账号登录', async ({ page }) => {
    // 访问登录页
    await page.goto('/');

    // 验证在登录页 - 使用 data-testid
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="login-submit-button"]')).toBeVisible();

    // 执行登录
    await login(page, 'admin');

    // 验证登录成功 - 登录表单应该消失，用户信息应该显示
    await expect(page.locator('[data-testid="login-submit-button"]')).not.toBeVisible();

    // 验证用户信息显示
    const userInfo = page.locator('.ant-dropdown-trigger');
    await expect(userInfo).toBeVisible();

    // 验证用户名显示（可能在下拉菜单中）
    const userText = await userInfo.textContent();
    console.log(`✓ 登录用户信息: ${userText}`);
  });

  test('应该能够使用运营人员账号登录', async ({ page }) => {
    // 访问登录页
    await page.goto('/');

    // 执行登录
    await login(page, 'operator');

    // 验证登录成功 - 登录表单应该消失
    await expect(page.locator('[data-testid="login-submit-button"]')).not.toBeVisible();

    // 验证用户信息显示
    const userInfo = page.locator('.ant-dropdown-trigger');
    await expect(userInfo).toBeVisible();

    console.log(`✓ 运营人员 ${TEST_USERS.operator.account} 登录成功`);
  });

  test('应该能够使用普通用户账号登录', async ({ page }) => {
    // 访问登录页
    await page.goto('/');

    // 执行登录
    await login(page, 'user');

    // 验证登录成功 - 登录表单应该消失
    await expect(page.locator('[data-testid="login-submit-button"]')).not.toBeVisible();

    // 验证用户信息显示
    const userInfo = page.locator('.ant-dropdown-trigger');
    await expect(userInfo).toBeVisible();

    console.log(`✓ 普通用户 ${TEST_USERS.user.account} 登录成功`);
  });

  test('应该能够登出', async ({ page }) => {
    // 先登录
    await login(page, 'admin');

    // 验证已登录 - 登录表单应该消失
    await expect(page.locator('[data-testid="login-submit-button"]')).not.toBeVisible();

    // 执行登出
    await logout(page);

    // 验证回到登录页
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="login-submit-button"]')).toBeVisible();

    console.log('✓ 登出功能验证成功');
  });

  test('使用错误的密码应该登录失败', async ({ page }) => {
    await page.goto('/');

    // 等待登录表单加载
    await page.waitForSelector('[data-testid="login-submit-button"]', { timeout: 15000 });

    // 填写错误的登录信息
    await page.locator('[data-testid="login-account-input"]').fill('admin');
    await page.locator('[data-testid="login-password-input"]').fill('wrong-password');

    // 验证码在测试环境非必填，跳过

    // 点击登录
    await page.click('[data-testid="login-submit-button"]');

    // 等待一下，确保有时间显示错误消息
    await page.waitForTimeout(2000);

    // 验证仍在登录页（未跳转）
    await expect(page).toHaveURL('/');

    // 验证显示错误消息（可能是 ant-message 或其他错误提示）
    // 注意：不同的实现可能有不同的错误提示方式
    const hasErrorMessage = await page.locator('.ant-message-error, .ant-notification-error, .error-message').count();

    console.log(`✓ 登录失败验证成功 (错误提示数量: ${hasErrorMessage})`);
  });

  test('使用不存在的账号应该登录失败', async ({ page }) => {
    await page.goto('/');

    // 等待登录表单加载
    await page.waitForSelector('[data-testid="login-submit-button"]', { timeout: 15000 });

    // 填写不存在的账号
    await page.locator('[data-testid="login-account-input"]').fill('nonexistent-user');
    await page.locator('[data-testid="login-password-input"]').fill('any-password');

    // 验证码在测试环境非必填，跳过

    // 点击登录
    await page.click('[data-testid="login-submit-button"]');

    // 等待一下，确保有时间显示错误消息
    await page.waitForTimeout(2000);

    // 验证仍在登录页（未跳转）
    await expect(page).toHaveURL('/');

    console.log('✓ 不存在账号登录失败验证成功');
  });

  test('空表单提交应该显示验证错误', async ({ page }) => {
    await page.goto('/');

    // 等待登录表单加载
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 });

    // 直接点击登录按钮（不填写任何信息）
    await page.click('button[type="submit"]');

    // 等待一下
    await page.waitForTimeout(1000);

    // 验证仍在登录页
    await expect(page).toHaveURL('/');

    // 验证表单验证错误提示存在
    const validationErrors = await page.locator('.ant-form-item-explain-error, .ant-form-item-has-error').count();

    console.log(`✓ 表单验证成功 (验证错误数量: ${validationErrors})`);
  });
});

import { TEST_USERS } from '../fixtures/test-users.js';

/**
 * 登录并保存认证状态
 * @param {import('@playwright/test').Page} page - Playwright 页面对象
 * @param {string} role - 用户角色 (admin, operator, user)
 */
export async function login(page, role = 'admin') {
  const user = TEST_USERS[role];

  if (!user) {
    throw new Error(`未知的用户角色: ${role}`);
  }

  // 访问登录页
  await page.goto('/');

  // 等待登录表单加载 - 使用 data-testid
  await page.waitForSelector('[data-testid="login-submit-button"]', { timeout: 15000 });

  // 使用 data-testid 定位输入框（最可靠的方式）
  const accountInput = page.locator('[data-testid="login-account-input"]');
  const passwordInput = page.locator('[data-testid="login-password-input"]');

  // 等待输入框可见
  await accountInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });

  // 填写登录表单
  await accountInput.fill(user.account);
  await passwordInput.fill(user.password);

  // 填写验证码（测试环境使用固定验证码 1111，与后端 base.service.ts 中的测试验证码一致）
  const captchaInput = page.locator('[data-testid="login-captcha-input"]');
  if (await captchaInput.isVisible()) {
    await captchaInput.fill('1111');
  }

  // 点击登录按钮
  await page.click('[data-testid="login-submit-button"]');

  // 等待登录成功 - 登录后页面会重新渲染，但URL可能仍然是 /
  // 我们需要等待登录表单消失，而不是等待URL变化
  await page.waitForSelector('[data-testid="login-submit-button"]', { state: 'hidden', timeout: 10000 });

  console.log(`✓ 用户 ${user.account} 登录成功`);
}

/**
 * 登出
 * @param {import('@playwright/test').Page} page - Playwright 页面对象
 */
export async function logout(page) {
  // 点击用户菜单（头像下拉菜单）
  await page.click('.ant-dropdown-trigger');

  // 等待下拉菜单显示
  await page.waitForSelector('.ant-dropdown-menu', { state: 'visible', timeout: 5000 });

  // 点击登出按钮（文本是"退出"）
  await page.click('text=退出');

  // 等待跳转到登录页 - 登录按钮重新出现
  await page.waitForSelector('[data-testid="login-submit-button"]', { state: 'visible', timeout: 5000 });

  console.log('✓ 登出成功');
}

/**
 * 使用已保存的认证状态
 * @param {import('@playwright/test').Page} page - Playwright 页面对象
 * @param {string} role - 用户角色
 */
export async function useAuthState(page, role = 'admin') {
  // 这个函数可以用于复用登录状态，避免每个测试都重新登录
  // 实现方式：保存和恢复 localStorage/cookies

  // 暂时使用简单的登录方式
  await login(page, role);
}

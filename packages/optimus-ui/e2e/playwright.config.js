// packages/optimus-ui/e2e/playwright.config.js
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载测试环境变量（从项目根目录）
const envFile = path.resolve(__dirname, '../../.env.e2e');

dotenv.config({ path: envFile });

console.log(`加载环境配置: ${envFile}`);

export default defineConfig({
  testDir: './tests',

  // 超时配置
  timeout: parseInt(process.env.TEST_TIMEOUT) || 30000,
  expect: {
    timeout: 5000,
  },

  // 测试配置
  fullyParallel: false, // 串行执行，避免数据冲突
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 单线程执行

  // 报告配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // 全局设置和清理
  globalSetup: path.resolve(__dirname, './global-setup.js'),
  globalTeardown: path.resolve(__dirname, './global-teardown.js'),

  // 全局配置
  use: {
    baseURL: process.env.REACT_APP_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 浏览器配置
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // 等待配置
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 浏览器项目
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

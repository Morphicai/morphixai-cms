// packages/optimus-ui/e2e/global-setup.js
import axios from 'axios';
import { startApp } from './helpers/app-server.js';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8084';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

/**
 * 等待后端 API 就绪
 */
async function waitForBackend() {
  console.log('等待后端 API 就绪...');

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(API_URL)
      await axios.get(`${API_URL}/api/health`, { timeout: 2000 });
      console.log('✓ 后端 API 已就绪');
      return true;
    } catch (error) {
      if (i === MAX_RETRIES - 1) {
        throw new Error(`后端 API 未就绪: ${API_URL}/health`);
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

/**
 * 验证测试数据库
 */
async function verifyTestDatabase() {
  console.log('验证测试数据库...');

  try {
    // 尝试登录测试用户
    const response = await axios.post(`${API_URL}/api/login`, {
      account: 'admin',
      password: 'admin',
      verifyCode: '1234',
      captchaId: 'test',
    });
    console.log(response)
    if (response.data.code === 200) {
      console.log('✓ 测试数据库验证成功');
      return true;
    }
  } catch (error) {
    console.error('✗ 测试数据库验证失败:', error.message);
    throw new Error('测试数据库未正确初始化，请运行: pnpm --filter optimus-api run db:seed:test');
  }
}

/**
 * 全局设置函数
 */
export default async function globalSetup() {
  console.log('\n========== E2E 测试环境设置 ==========\n');

  console.log('模式: 真实后端 API');
  await waitForBackend();
  await verifyTestDatabase();

  // 启动前端应用（测试模式）
  await startApp();

  console.log('\n========== 环境设置完成 ==========\n');
}

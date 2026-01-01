// packages/optimus-ui/e2e/global-teardown.js
import { stopApp } from './helpers/app-server.js';

/**
 * 全局清理函数
 */
export default async function globalTeardown() {
  console.log('\n========== E2E 测试环境清理 ==========\n');

  // 关闭前端应用
  await stopApp();

  console.log('\n========== 环境清理完成 ==========\n');
}

import axios from 'axios';

/**
 * 初始化 API 模式
 */
export async function initializeApiMode() {
  console.log('\n========== 使用真实后端 API ==========\n');
  // 验证后端可用性
  const API_URL = process.env.REACT_APP_API_BASE_URL;

  try {
    await axios.get(`${API_URL}/health`, { timeout: 3000 });
    console.log('✓ 后端 API 已就绪');
  } catch (error) {
    throw new Error(
      `后端 API 未就绪: ${API_URL}/health\n` +
      `请先启动后端服务: pnpm --filter optimus-api run dev`
    );
  }
}

/**
 * 清理 API 模式
 */
export function cleanupApiMode() {
  // 不再需要清理操作
}

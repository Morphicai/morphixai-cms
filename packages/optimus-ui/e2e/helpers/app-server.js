// packages/optimus-ui/e2e/helpers/app-server.js
import { spawn } from 'child_process';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 前端应用配置
const APP_URL = process.env.REACT_APP_URL;
const APP_PORT = new URL(APP_URL).port || '8082';
const MAX_STARTUP_TIME = 120000; // 120 秒
const HEALTH_CHECK_INTERVAL = 2000; // 2 秒

/**
 * 前端应用服务器管理器
 */
class AppServer {
  constructor() {
    this.process = null;
    this.isRunning = false;
  }

  /**
   * 检查前端应用是否已经在运行
   */
  async isAppRunning() {
    try {
      await axios.get(APP_URL, { timeout: 2000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 等待前端应用启动完成
   */
  async waitForAppReady() {
    const startTime = Date.now();

    console.log(`等待前端应用启动: ${APP_URL}`);

    while (Date.now() - startTime < MAX_STARTUP_TIME) {
      try {
        const response = await axios.get(APP_URL, { timeout: 2000 });
        if (response.status === 200) {
          console.log('✓ 前端应用已就绪');
          return true;
        }
      } catch (error) {
        // 继续等待
      }

      await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
    }

    throw new Error(`前端应用启动超时 (${MAX_STARTUP_TIME}ms)`);
  }

  /**
   * 启动前端应用（测试模式）
   */
  async start() {
    // 检查是否已经在运行
    if (await this.isAppRunning()) {
      console.log('✓ 前端应用已在运行，跳过启动');
      this.isRunning = false; // 标记为外部启动，不需要我们关闭
      return;
    }

    console.log('\n========== 启动前端应用 ==========\n');

    // 获取项目根目录
    const projectRoot = path.resolve(__dirname, '../..');

    console.log(`使用环境配置: .env.e2e`);
    console.log(`工作目录: ${projectRoot}`);
    console.log(`启动命令: pnpm run dev`);

    // 使用 spawn 启动子进程
    this.process = spawn('pnpm', ['run', 'dev'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        // 注入测试环境变量
        PORT: APP_PORT,
        BROWSER: 'none', // 不自动打开浏览器
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      detached: false,
    });

    // 标记为运行中
    this.isRunning = true;

    // 监听输出
    this.process.stdout.on('data', (data) => {
      const output = data.toString();
      // 只显示关键信息
      if (output.includes('webpack compiled') ||
        output.includes('Compiled successfully') ||
        output.includes('On Your Network')) {
        console.log(`[前端] ${output.trim()}`);
      }
    });

    this.process.stderr.on('data', (data) => {
      const error = data.toString();
      // 过滤掉一些常见的警告
      if (!error.includes('DeprecationWarning') &&
        !error.includes('ExperimentalWarning')) {
        console.error(`[前端错误] ${error.trim()}`);
      }
    });

    this.process.on('error', (error) => {
      console.error('前端应用启动失败:', error);
      this.isRunning = false;
    });

    this.process.on('exit', (code, signal) => {
      if (code !== null && code !== 0) {
        console.log(`前端应用进程退出，代码: ${code}, 信号: ${signal}`);
      }
      this.isRunning = false;
    });

    // 等待应用启动完成
    await this.waitForAppReady();

    console.log('\n========== 前端应用启动完成 ==========\n');
  }

  /**
   * 停止前端应用
   */
  async stop() {
    if (!this.isRunning || !this.process) {
      console.log('前端应用未由测试启动，跳过关闭');
      return;
    }

    console.log('\n========== 关闭前端应用 ==========\n');

    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      // 设置超时，确保进程被关闭
      const timeout = setTimeout(() => {
        if (this.process && !this.process.killed) {
          console.log('强制终止前端应用进程');
          this.process.kill('SIGKILL');
        }
        resolve();
      }, 5000);

      this.process.on('exit', () => {
        clearTimeout(timeout);
        console.log('✓ 前端应用已关闭');
        this.process = null;
        this.isRunning = false;
        resolve();
      });

      // 发送终止信号
      try {
        this.process.kill('SIGTERM');
      } catch (error) {
        console.error('关闭前端应用时出错:', error);
        clearTimeout(timeout);
        resolve();
      }
    });
  }

  /**
   * 重启前端应用
   */
  async restart() {
    await this.stop();
    await this.start();
  }
}

// 导出单例实例
export const appServer = new AppServer();

/**
 * 启动前端应用（便捷函数）
 */
export async function startApp() {
  await appServer.start();
}

/**
 * 停止前端应用（便捷函数）
 */
export async function stopApp() {
  await appServer.stop();
}

/**
 * 重启前端应用（便捷函数）
 */
export async function restartApp() {
  await appServer.restart();
}

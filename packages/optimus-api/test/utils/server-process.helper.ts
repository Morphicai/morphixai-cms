import { spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import axios from "axios";
import * as http from "http";
import * as https from "https";

const sleep = promisify(setTimeout);

export interface ServerProcessConfig {
    command: string;
    args: string[];
    cwd?: string;
    env?: Record<string, string>;
    port: number;
    host?: string;
    startupTimeout?: number;
    shutdownTimeout?: number;
}

/**
 * 服务器子进程管理助手
 * 用于启动、监控和关闭测试服务器进程
 */
export class ServerProcessHelper {
    private process: ChildProcess | null = null;
    private config: ServerProcessConfig;
    private isStarting = false;
    private isShuttingDown = false;
    private activeTimeouts: Set<NodeJS.Timeout> = new Set();

    constructor(config: ServerProcessConfig) {
        this.config = {
            host: "localhost",
            startupTimeout: 30000,
            shutdownTimeout: 10000,
            ...config,
        };
    }

    /**
     * 启动服务器进程
     */
    async start(): Promise<void> {
        if (this.process || this.isStarting) {
            console.log("🔄 Server process already running or starting");
            return;
        }

        this.isStarting = true;

        try {
            console.log(`🚀 Starting server process: ${this.config.command} ${this.config.args.join(" ")}`);

            // 启动子进程
            this.process = spawn(this.config.command, this.config.args, {
                cwd: this.config.cwd || process.cwd(),
                env: {
                    ...process.env,
                    ...this.config.env,
                },
                stdio: ["pipe", "pipe", "pipe"],
                detached: false,
            });

            // 监听进程事件
            this.setupProcessListeners();

            // 等待服务器启动
            await this.waitForServerReady();

            console.log(`✅ Server process started successfully on ${this.config.host}:${this.config.port}`);
        } catch (error) {
            await this.cleanup();
            throw new Error(`Failed to start server process: ${error.message}`);
        } finally {
            this.isStarting = false;
        }
    }

    /**
     * 设置进程监听器
     */
    private setupProcessListeners(): void {
        if (!this.process) return;

        // 监听标准输出
        this.process.stdout?.on("data", (data) => {
            const output = data.toString().trim();
            if (output) {
                console.log(`[SERVER] ${output}`);
            }
        });

        // 监听错误输出
        this.process.stderr?.on("data", (data) => {
            const error = data.toString().trim();
            if (error) {
                console.error(`[SERVER ERROR] ${error}`);
            }
        });

        // 监听进程退出
        this.process.on("exit", (code, signal) => {
            console.log(`[SERVER] Process exited with code ${code}, signal ${signal}`);
            this.process = null;
        });

        // 监听进程错误
        this.process.on("error", (error) => {
            console.error(`[SERVER] Process error:`, error);
        });
    }

    /**
     * 等待服务器就绪
     */
    private async waitForServerReady(): Promise<void> {
        const startTime = Date.now();
        const baseUrl = `http://${this.config.host}:${this.config.port}`;

        console.log(`⏳ Waiting for server to be ready at ${baseUrl}`);

        while (Date.now() - startTime < (this.config.startupTimeout || 30000)) {
            try {
                // 尝试连接服务器 - 使用健康检查端点
                const response = await axios.get(`${baseUrl}/api`, {
                    timeout: 3000,
                    validateStatus: () => true, // 接受任何状态码
                    // 禁用连接池，确保连接可以正确关闭
                    httpAgent: new http.Agent({ keepAlive: false }),
                    httpsAgent: new https.Agent({ keepAlive: false }),
                });

                if (response.status < 500) {
                    console.log(`✅ Server is ready (status: ${response.status})`);
                    return;
                }

                console.log(`⏳ Server responded with status ${response.status}, waiting...`);
            } catch (error) {
                // 连接失败，继续等待
                if (error.code === "ECONNREFUSED") {
                    console.log(`⏳ Server not ready yet (connection refused), waiting...`);
                } else {
                    console.log(`⏳ Server check error: ${error.message}, waiting...`);
                }
            }

            await this.managedSleep(1000);
        }

        throw new Error(`Server failed to start within ${this.config.startupTimeout}ms`);
    }

    /**
     * 受管理的 sleep 函数，跟踪所有超时
     */
    private managedSleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                this.activeTimeouts.delete(timeout);
                resolve();
            }, ms);
            this.activeTimeouts.add(timeout);
        });
    }

    /**
     * 停止服务器进程
     */
    async stop(): Promise<void> {
        if (!this.process || this.isShuttingDown) {
            console.log("🔄 Server process not running or already shutting down");
            return;
        }

        this.isShuttingDown = true;

        try {
            console.log("🛑 Stopping server process...");

            // 发送 SIGTERM 信号
            this.process.kill("SIGTERM");

            // 等待进程优雅退出
            const exitPromise = new Promise<void>((resolve) => {
                this.process?.on("exit", () => resolve());
            });

            const timeoutPromise = this.managedSleep(this.config.shutdownTimeout || 10000).then(() => {
                throw new Error("Shutdown timeout");
            });

            try {
                await Promise.race([exitPromise, timeoutPromise]);
                console.log("✅ Server process stopped gracefully");
            } catch (error) {
                console.warn("⚠️  Graceful shutdown timeout, forcing kill...");
                this.process?.kill("SIGKILL");
                // 使用普通的 setTimeout 而不是 managedSleep，因为我们即将清理
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error("❌ Error stopping server process:", error.message);
        } finally {
            await this.cleanup();
            this.isShuttingDown = false;
        }
    }

    /**
     * 清理资源
     */
    private async cleanup(): Promise<void> {
        // 清理所有活跃的超时
        for (const timeout of this.activeTimeouts) {
            clearTimeout(timeout);
        }
        this.activeTimeouts.clear();

        if (this.process) {
            try {
                if (!this.process.killed) {
                    this.process.kill("SIGKILL");
                }
            } catch (error) {
                // 忽略清理错误
            }
            this.process = null;
        }
    }

    /**
     * 检查服务器是否运行
     */
    isRunning(): boolean {
        return this.process !== null && !this.process.killed;
    }

    /**
     * 获取进程 PID
     */
    getPid(): number | undefined {
        return this.process?.pid;
    }

    /**
     * 获取服务器 URL
     */
    getServerUrl(): string {
        return `http://${this.config.host}:${this.config.port}`;
    }

    /**
     * 重启服务器
     */
    async restart(): Promise<void> {
        console.log("🔄 Restarting server process...");
        await this.stop();
        await this.managedSleep(1000);
        await this.start();
    }

    /**
     * 等待服务器健康检查
     */
    async waitForHealth(endpoint = "/api", timeout = 10000): Promise<void> {
        const startTime = Date.now();
        const url = `${this.getServerUrl()}${endpoint}`;

        console.log(`🔍 Starting health check for ${url}`);

        while (Date.now() - startTime < timeout) {
            try {
                const response = await axios.get(url, {
                    timeout: 3000,
                    validateStatus: () => true, // 接受任何状态码
                    // 禁用连接池，确保连接可以正确关闭
                    httpAgent: new http.Agent({ keepAlive: false }),
                    httpsAgent: new https.Agent({ keepAlive: false }),
                });

                console.log(`🔍 Health check response: ${response.status}`);

                if (response.status < 500) {
                    console.log(`✅ Health check passed for ${url}`);
                    return;
                }
            } catch (error) {
                if (error.code === "ECONNREFUSED") {
                    console.log(`🔍 Health check: connection refused, server not ready yet`);
                } else {
                    console.log(`🔍 Health check error: ${error.message}`);
                }
            }
            await this.managedSleep(1000);
        }

        throw new Error(`Health check failed for ${url} within ${timeout}ms`);
    }
}

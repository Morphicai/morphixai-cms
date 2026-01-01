import { Injectable, Logger } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { existsSync } from "fs";

const execAsync = promisify(exec);

@Injectable()
export class DeployWebhookService {
    private readonly logger = new Logger(DeployWebhookService.name);
    private isDeploying = false;

    /**
     * 获取项目根目录
     * 从当前目录向上查找，直到找到包含 package.json 和 ecosystem.config.js 的目录
     */
    private getProjectRoot(): string {
        let currentDir = __dirname;

        // 向上查找最多10层
        for (let i = 0; i < 10; i++) {
            const packageJsonPath = join(currentDir, "package.json");
            const ecosystemConfigPath = join(currentDir, "ecosystem.config.js");

            // 检查是否存在这两个文件（项目根目录的标志）
            if (existsSync(packageJsonPath) && existsSync(ecosystemConfigPath)) {
                return currentDir;
            }

            // 向上一级目录
            const parentDir = join(currentDir, "..");
            if (parentDir === currentDir) {
                // 已经到达根目录，无法继续向上
                break;
            }
            currentDir = parentDir;
        }

        // 如果没找到，使用 process.cwd() 作为后备
        return process.cwd();
    }

    /**
     * 执行部署流程
     */
    async deploy(): Promise<{ success: boolean; message: string; logs?: string }> {
        if (this.isDeploying) {
            return {
                success: false,
                message: "部署正在进行中，请稍后再试",
            };
        }

        this.isDeploying = true;
        this.logger.log("=".repeat(80));
        this.logger.log("🚀 开始执行部署流程");
        this.logger.log("=".repeat(80));

        try {
            // 获取项目根目录
            const projectRoot = this.getProjectRoot();
            this.logger.log(`📁 当前目录: ${process.cwd()}`);
            this.logger.log(`📁 项目根目录: ${projectRoot}`);

            // 步骤 1: Git pull
            this.logger.log("📥 步骤 1: 拉取最新代码...");
            const gitResult = await this.executeCommand("git pull", projectRoot);
            this.logger.log(`Git Pull 输出: ${gitResult.stdout}`);
            if (gitResult.stderr) {
                this.logger.warn(`Git Pull 警告: ${gitResult.stderr}`);
            }

            // 步骤 2: 执行部署脚本
            this.logger.log("🔨 步骤 2: 执行部署脚本...");
            this.logger.log("执行命令: npm run deploy:online");

            // 使用后台方式执行部署脚本，不等待完成
            // 因为部署脚本可能会重启服务器，导致连接断开
            this.executeDeploymentInBackground(projectRoot);

            const successMessage = "部署流程已启动，服务将在后台完成部署和重启";
            this.logger.log("✅ " + successMessage);
            this.logger.log("=".repeat(80));

            return {
                success: true,
                message: successMessage,
                logs: gitResult.stdout,
            };
        } catch (error) {
            this.logger.error("❌ 部署失败:", error.message);
            this.logger.error(error.stack);

            return {
                success: false,
                message: `部署失败: ${error.message}`,
                logs: error.stderr || error.stdout || error.message,
            };
        } finally {
            // 延迟重置部署状态，给后台部署一些时间
            setTimeout(() => {
                this.isDeploying = false;
            }, 5000);
        }
    }

    /**
     * 在后台执行部署脚本
     */
    private executeDeploymentInBackground(projectRoot: string): void {
        const command = "pnpm run deploy:online";

        this.logger.log("🔄 在后台启动部署脚本...");
        this.logger.log(`执行目录: ${projectRoot}`);

        // 使用 spawn 或 exec 在后台执行，不等待完成
        exec(command, { cwd: projectRoot }, (error, stdout, stderr) => {
            if (error) {
                this.logger.error(`❌ 后台部署执行出错: ${error.message}`);
                if (stderr) {
                    this.logger.error(`错误输出: ${stderr}`);
                }
                if (stdout) {
                    this.logger.error(`标准输出: ${stdout}`);
                }
                return;
            }

            if (stdout) {
                this.logger.log(`部署脚本输出: ${stdout}`);
            }

            if (stderr) {
                this.logger.warn(`部署脚本警告: ${stderr}`);
            }

            this.logger.log("✅ 后台部署脚本执行完成");
        });

        this.logger.log("📤 后台部署已启动，不等待完成");
    }

    /**
     * 执行命令并返回结果
     */
    private async executeCommand(command: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
        try {
            const result = await execAsync(command, {
                cwd,
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
            });

            return {
                stdout: result.stdout || "",
                stderr: result.stderr || "",
            };
        } catch (error) {
            // exec 在命令返回非零状态码时会抛出错误
            // 但我们仍然需要返回输出信息
            throw {
                message: error.message,
                stdout: error.stdout || "",
                stderr: error.stderr || "",
            };
        }
    }
}

import * as fs from "fs";
import * as path from "path";
import config from "../config";

/**
 * 初始化日志目录
 * 确保日志目录存在且具有正确的权限
 */
export function initializeLogDirectory(): void {
    try {
        const appConfig = config();
        const logDir = appConfig.app.logger.dir;

        // 解析日志目录路径
        const baseLogPath = path.normalize(path.isAbsolute(logDir) ? logDir : path.join(process.cwd(), logDir));

        // 确保日志目录存在
        if (!fs.existsSync(baseLogPath)) {
            fs.mkdirSync(baseLogPath, { recursive: true });
            console.log(`Log directory created: ${baseLogPath}`);
        }

        // 确保子目录存在
        const subDirs = ["access", "app-out", "errors"];
        subDirs.forEach((subDir) => {
            const subDirPath = path.join(baseLogPath, subDir);
            if (!fs.existsSync(subDirPath)) {
                fs.mkdirSync(subDirPath, { recursive: true });
                console.log(`Log subdirectory created: ${subDirPath}`);
            }
        });

        // 检查权限
        try {
            fs.accessSync(baseLogPath, fs.constants.R_OK | fs.constants.W_OK);
            console.log(`Log directory initialized successfully: ${baseLogPath}`);
        } catch (permissionError) {
            console.error(`Log directory permission error: ${permissionError.message}`);
            throw new Error(`Cannot write to log directory: ${baseLogPath}`);
        }
    } catch (error) {
        console.error("Failed to initialize log directory:", error.message);
        throw error;
    }
}

/**
 * 获取日志目录路径
 * @returns 日志目录的绝对路径
 */
export function getLogDirectoryPath(): string {
    const appConfig = config();
    const logDir = appConfig.app.logger.dir;

    return path.normalize(path.isAbsolute(logDir) ? logDir : path.join(process.cwd(), logDir));
}

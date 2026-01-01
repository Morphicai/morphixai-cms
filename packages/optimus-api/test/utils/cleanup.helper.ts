/**
 * 测试清理助手 - 确保所有资源都被正确清理
 */

/**
 * 强制清理所有可能的资源泄漏
 */
export class CleanupHelper {
    private static activeTimeouts = new Set<NodeJS.Timeout>();
    private static activeIntervals = new Set<NodeJS.Timer>();
    private static activeConnections = new Set<any>();

    /**
     * 注册需要清理的超时
     */
    static registerTimeout(timeout: NodeJS.Timeout): void {
        this.activeTimeouts.add(timeout);
    }

    /**
     * 注册需要清理的间隔
     */
    static registerInterval(interval: NodeJS.Timer): void {
        this.activeIntervals.add(interval);
    }

    /**
     * 注册需要清理的连接
     */
    static registerConnection(connection: any): void {
        this.activeConnections.add(connection);
    }

    /**
     * 清理所有注册的资源
     */
    static async cleanupAll(): Promise<void> {
        console.log("🧹 Starting comprehensive cleanup...");

        // 清理超时
        for (const timeout of this.activeTimeouts) {
            try {
                clearTimeout(timeout);
            } catch (error) {
                // 忽略清理错误
            }
        }
        this.activeTimeouts.clear();

        // 清理间隔
        for (const interval of this.activeIntervals) {
            try {
                clearInterval(interval);
            } catch (error) {
                // 忽略清理错误
            }
        }
        this.activeIntervals.clear();

        // 清理连接
        for (const connection of this.activeConnections) {
            try {
                if (connection && typeof connection.close === "function") {
                    await connection.close();
                } else if (connection && typeof connection.destroy === "function") {
                    connection.destroy();
                } else if (connection && typeof connection.end === "function") {
                    connection.end();
                }
            } catch (error) {
                // 忽略清理错误
            }
        }
        this.activeConnections.clear();

        // 强制垃圾回收（如果可用）
        if (global.gc) {
            global.gc();
        }

        // 清理 Node.js 事件循环中的未处理引用
        if (process.env.NODE_ENV === "e2e") {
            // 等待一小段时间让异步操作完成
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        console.log("✅ Comprehensive cleanup completed");
    }

    /**
     * 创建受管理的超时
     */
    static createManagedTimeout(callback: () => void, delay: number): NodeJS.Timeout {
        const timeout = setTimeout(() => {
            this.activeTimeouts.delete(timeout);
            callback();
        }, delay);
        this.registerTimeout(timeout);
        return timeout;
    }

    /**
     * 创建受管理的间隔
     */
    static createManagedInterval(callback: () => void, delay: number): NodeJS.Timer {
        const interval = setInterval(callback, delay);
        this.registerInterval(interval);
        return interval;
    }

    /**
     * 创建受管理的 Promise 延迟
     */
    static createManagedDelay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            const timeout = this.createManagedTimeout(resolve, ms);
            // timeout 已经在 createManagedTimeout 中注册了
        });
    }

    /**
     * 检查是否有未清理的资源
     */
    static getResourceStatus(): {
        timeouts: number;
        intervals: number;
        connections: number;
    } {
        return {
            timeouts: this.activeTimeouts.size,
            intervals: this.activeIntervals.size,
            connections: this.activeConnections.size,
        };
    }

    /**
     * 重置所有资源跟踪
     */
    static reset(): void {
        this.activeTimeouts.clear();
        this.activeIntervals.clear();
        this.activeConnections.clear();
    }
}

/**
 * Jest 全局清理钩子
 */
export function setupGlobalCleanup(): void {
    // 在每个测试后清理
    afterEach(async () => {
        const status = CleanupHelper.getResourceStatus();
        if (status.timeouts > 0 || status.intervals > 0 || status.connections > 0) {
            console.warn("⚠️  Detected uncleaned resources:", status);
            await CleanupHelper.cleanupAll();
        }
    });

    // 在所有测试结束后强制清理
    afterAll(async () => {
        await CleanupHelper.cleanupAll();
    });
}

// 导出便捷函数
export const managedTimeout = CleanupHelper.createManagedTimeout.bind(CleanupHelper);
export const managedInterval = CleanupHelper.createManagedInterval.bind(CleanupHelper);
export const managedDelay = CleanupHelper.createManagedDelay.bind(CleanupHelper);

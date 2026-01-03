/**
 * 环境变量工具
 * 统一管理常用的环境变量和配置
 */

/**
 * 环境类型
 */
export enum Environment {
    DEVELOPMENT = "development",
    PRODUCTION = "production",
    TEST = "test",
    E2E = "e2e",
}

/**
 * 日志级别
 */
export enum LogLevel {
    TRACE = "TRACE",
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    FATAL = "FATAL",
    OFF = "OFF",
}

/**
 * 获取当前环境
 */
export function getEnvironment(): Environment {
    const env = process.env.NODE_ENV || Environment.DEVELOPMENT;
    return env as Environment;
}

/**
 * 是否为生产环境
 */
export const isProduction = (): boolean => getEnvironment() === Environment.PRODUCTION;

/**
 * 是否为开发环境
 */
export const isDevelopment = (): boolean => getEnvironment() === Environment.DEVELOPMENT;

/**
 * 是否为测试环境
 */
export const isTest = (): boolean => {
    const env = getEnvironment();
    return env === Environment.TEST || env === Environment.E2E;
};

/**
 * 是否为 E2E 测试环境
 */
export const isE2E = (): boolean => getEnvironment() === Environment.E2E;

/**
 * 慢操作阈值（毫秒）
 */
export const SLOW_OPERATION_THRESHOLD = 1000; // 1秒

/**
 * 获取日志级别
 * 生产环境：INFO
 * 其他环境：DEBUG
 */
export function getLogLevel(): LogLevel {
    return isProduction() ? LogLevel.INFO : LogLevel.DEBUG;
}

/**
 * 获取日志级别字符串（用于 log4js）
 */
export function getLogLevelString(): string {
    return getLogLevel().toLowerCase();
}

/**
 * 是否启用详细日志
 * 生产环境：false
 * 其他环境：true
 */
export const isVerboseLogging = (): boolean => !isProduction();

/**
 * 是否记录响应数据
 * 生产环境：false（只记录大小）
 * 其他环境：true（记录完整数据）
 */
export const shouldLogResponseData = (): boolean => !isProduction();

/**
 * 是否记录操作开始日志
 * 生产环境：false
 * 其他环境：true
 */
export const shouldLogOperationStart = (): boolean => !isProduction();

/**
 * 是否记录成功操作日志
 * 生产环境：只记录慢操作和重要操作
 * 其他环境：记录所有操作
 */
export function shouldLogSuccessfulOperation(duration: number, isImportant = false): boolean {
    if (!isProduction()) {
        return true;
    }
    // 生产环境：只记录慢操作或重要操作
    return duration > SLOW_OPERATION_THRESHOLD || isImportant;
}

/**
 * 是否记录性能指标（DEBUG 级别）
 * 生产环境：false
 * 其他环境：true
 */
export const shouldLogPerformanceMetrics = (): boolean => !isProduction();

/**
 * 获取应用端口
 */
export function getAppPort(): number {
    return parseInt(process.env.APP_PORT || "8084", 10);
}

/**
 * 获取数据库日志级别
 */
export function getDatabaseLogging(): boolean {
    return process.env.DB_LOGGING === "true" || (!isProduction() && process.env.DB_LOGGING !== "false");
}

/**
 * 获取数据库同步配置
 */
export function getDatabaseSynchronize(): boolean {
    return process.env.DB_SYNCHRONIZE === "true" || (!isProduction() && process.env.DB_SYNCHRONIZE !== "false");
}

/**
 * 是否启用 Swagger
 */
export function isSwaggerEnabled(): boolean {
    return process.env.SWAGGER_ENABLED === "true" || (!isProduction() && process.env.SWAGGER_ENABLED !== "false");
}

/**
 * 获取日志目录
 */
export function getLogDirectory(): string {
    return process.env.LOG_DIR || "./logs";
}

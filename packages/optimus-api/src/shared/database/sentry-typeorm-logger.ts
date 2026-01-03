import { Logger as NestLogger } from "@nestjs/common";
import { Logger as TypeOrmLogger, QueryRunner } from "typeorm";
import * as Sentry from "@sentry/nestjs";

/**
 * 自定义 TypeORM Logger，用于捕获数据库错误并上报到 Sentry
 */
export class SentryTypeOrmLogger implements TypeOrmLogger {
    private readonly logger = new NestLogger("TypeORM");

    /**
     * 打印数据库连接信息（用于调试）
     */
    private printConnectionInfo(): void {
        const host = process.env.DB_HOST || "未设置";
        const port = process.env.DB_PORT || "未设置";
        const database = process.env.DB_DATABASE || "未设置";
        const username = process.env.DB_USERNAME || "未设置";
        const password = process.env.DB_PASSWORD ? "***已设置***" : "未设置";
        const charset = process.env.DB_CHARSET || "未设置";

        this.logger.error("=== 数据库连接信息（连接失败时） ===");
        this.logger.error(`连接字符串: mysql://${username}:***@${host}:${port}/${database}`);
        this.logger.error(`Host: ${host}`);
        this.logger.error(`Port: ${port}`);
        this.logger.error(`Database: ${database}`);
        this.logger.error(`Username: ${username}`);
        this.logger.error(`Password: ${password}`);
        this.logger.error(`Charset: ${charset}`);
        this.logger.error(`NODE_ENV: ${process.env.NODE_ENV || "未设置"}`);
        this.logger.error("=====================================");
    }

    /**
     * 记录查询日志
     */
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): void {
        // 只在开发环境记录查询日志
        if (process.env.NODE_ENV === "development") {
            this.logger.debug(`Query: ${query}`);
            if (parameters && parameters.length) {
                this.logger.debug(`Parameters: ${JSON.stringify(parameters)}`);
            }
        }
    }

    /**
     * 记录查询错误
     */
    logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner): void {
        const errorMessage = typeof error === "string" ? error : error.message;
        const errorObj = typeof error === "string" ? new Error(error) : error;

        // 检查是否是索引重复错误（synchronize 导致的常见问题）
        const isDuplicateIndexError =
            errorMessage.includes("Duplicate key name") ||
            errorMessage.includes("duplicate key") ||
            (errorMessage.includes("IDX_") && errorMessage.includes("already exists"));

        if (isDuplicateIndexError) {
            // 从 SQL 中提取表名和索引名
            const tableMatch =
                query.match(/TABLE\s+[`"]?(\w+)[`"]?/i) ||
                query.match(/ON\s+[`"]?(\w+)[`"]?/i) ||
                query.match(/ALTER\s+TABLE\s+[`"]?(\w+)[`"]?/i);
            const indexMatch =
                query.match(/INDEX\s+[`"]?(\w+)[`"]?/i) ||
                errorMessage.match(/['"](\w+)['"]/) ||
                errorMessage.match(/IDX_[\w]+/);

            const tableName = tableMatch ? tableMatch[1] : "未知表";
            const indexName = indexMatch ? indexMatch[1] : "未知索引";

            this.logger.error(`⚠️  索引重复错误（通常由 synchronize 导致）`);
            this.logger.error(`    错误信息: ${errorMessage}`);
            this.logger.error(`    表名: ${tableName}`);
            this.logger.error(`    索引名: ${indexName}`);
            this.logger.error(`    完整 SQL: ${query}`);
            this.logger.error(`    💡 提示: 如果数据库结构已存在，建议设置 DB_SYNCHRONIZE=false 关闭自动同步`);
            this.logger.error(`    或者手动修复数据库索引，确保实体定义与数据库结构一致`);
            this.logger.error(`    检查实体: 搜索包含 "${indexName}" 或表 "${tableName}" 的实体定义`);

            // 索引重复错误通常不需要上报到 Sentry（除非是生产环境）
            if (process.env.NODE_ENV === "production") {
                Sentry.captureException(errorObj, {
                    tags: {
                        component: "typeorm",
                        errorType: "duplicate-index",
                    },
                    contexts: {
                        query: {
                            sql: query,
                            parameters: parameters,
                        },
                    },
                    level: "warning",
                });
            }
            return;
        }

        this.logger.error(`Query failed: ${query}`);
        this.logger.error(`Error: ${error}`);

        // 上报到 Sentry
        Sentry.captureException(errorObj, {
            tags: {
                component: "typeorm",
                errorType: "query",
            },
            contexts: {
                query: {
                    sql: query,
                    parameters: parameters,
                },
            },
        });
    }

    /**
     * 记录慢查询
     */
    logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner): void {
        this.logger.warn(`Slow query detected (${time}ms): ${query}`);

        // 慢查询也上报到 Sentry（作为警告）
        Sentry.captureMessage(`Slow query detected: ${time}ms`, {
            level: "warning",
            tags: {
                component: "typeorm",
                errorType: "slow-query",
            },
            contexts: {
                query: {
                    sql: query,
                    parameters: parameters,
                    executionTime: time,
                },
            },
        });
    }

    /**
     * 记录 schema 构建日志
     */
    logSchemaBuild(message: string, queryRunner?: QueryRunner): void {
        this.logger.log(`Schema: ${message}`);
    }

    /**
     * 记录迁移日志
     */
    logMigration(message: string, queryRunner?: QueryRunner): void {
        this.logger.log(`Migration: ${message}`);
    }

    /**
     * 记录普通日志
     */
    log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner): void {
        const messageStr = typeof message === "string" ? message : String(message);
        const isConnectionError =
            messageStr.includes("Unable to connect to the database") ||
            messageStr.includes("Connection lost") ||
            messageStr.includes("The server closed the connection") ||
            messageStr.includes("ECONNREFUSED") ||
            messageStr.includes("Access denied") ||
            messageStr.includes("ETIMEDOUT");

        // 检查是否是索引重复错误（可能通过 log 方法传递）
        const isDuplicateIndexError =
            messageStr.includes("Duplicate key name") ||
            messageStr.includes("duplicate key") ||
            (messageStr.includes("IDX_") && messageStr.includes("Duplicate"));

        if (isDuplicateIndexError) {
            // 从错误消息中提取索引名
            const indexMatch = messageStr.match(/IDX_[\w]+/) || messageStr.match(/['"](\w+)['"]/);
            const indexName = indexMatch ? indexMatch[0] : "未知索引";

            this.logger.error(`⚠️  索引重复错误（通过 log 方法捕获）`);
            this.logger.error(`    错误信息: ${messageStr}`);
            this.logger.error(`    索引名: ${indexName}`);
            this.logger.error(`    💡 提示: 如果数据库结构已存在，建议设置 DB_SYNCHRONIZE=false 关闭自动同步`);
            this.logger.error(`    或者手动修复数据库索引，确保实体定义与数据库结构一致`);
            return;
        }

        // 如果是连接错误，打印详细的连接信息
        if (isConnectionError) {
            this.printConnectionInfo();
        }

        switch (level) {
            case "log":
            case "info":
                this.logger.log(message);
                break;
            case "warn":
                this.logger.warn(message);
                // 警告也上报到 Sentry
                if (typeof message === "string" && message.toLowerCase().includes("error")) {
                    Sentry.captureMessage(message, {
                        level: "warning",
                        tags: {
                            component: "typeorm",
                            errorType: "warning",
                        },
                    });
                }
                break;
        }
    }
}

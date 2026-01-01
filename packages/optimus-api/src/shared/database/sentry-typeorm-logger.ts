import { Logger as NestLogger } from "@nestjs/common";
import { Logger as TypeOrmLogger, QueryRunner } from "typeorm";
import * as Sentry from "@sentry/nestjs";

/**
 * 自定义 TypeORM Logger，用于捕获数据库错误并上报到 Sentry
 */
export class SentryTypeOrmLogger implements TypeOrmLogger {
    private readonly logger = new NestLogger("TypeORM");

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
        this.logger.error(`Query failed: ${query}`);
        this.logger.error(`Error: ${error}`);

        // 上报到 Sentry
        const errorObj = typeof error === "string" ? new Error(error) : error;
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

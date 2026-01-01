import { Logger } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";

/**
 * TypeORM 错误处理器
 * 捕获数据库连接和查询错误，并上报到 Sentry
 */
export class TypeOrmErrorHandler {
    private static readonly logger = new Logger("TypeOrmErrorHandler");

    /**
     * 处理数据库连接错误
     */
    static handleConnectionError(error: Error, context?: Record<string, any>): void {
        this.logger.error("Database connection error:", error);

        // 上报到 Sentry
        Sentry.captureException(error, {
            tags: {
                component: "typeorm",
                errorType: "connection",
            },
            contexts: {
                database: {
                    ...context,
                    environment: process.env.NODE_ENV,
                    host: process.env.DB_HOST,
                    database: process.env.DB_DATABASE,
                    port: process.env.DB_PORT,
                },
            },
            level: "fatal",
        });
    }

    /**
     * 处理数据库查询错误
     */
    static handleQueryError(error: Error, query?: string, parameters?: any[]): void {
        this.logger.error("Database query error:", error);

        // 上报到 Sentry
        Sentry.captureException(error, {
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
}

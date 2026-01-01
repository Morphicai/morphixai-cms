import { LoggerService } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";

/**
 * Sentry Logger Service
 * 拦截所有日志并将 ERROR 和 WARN 级别的日志上报到 Sentry
 */
export class SentryLoggerService implements LoggerService {
    log(message: any, ...optionalParams: any[]): void {
        console.log(message, ...optionalParams);
    }

    error(message: any, ...optionalParams: any[]): void {
        console.error(message, ...optionalParams);

        const errorMessage = this.formatMessage(message, optionalParams);
        const stack = optionalParams.find((param) => param instanceof Error)?.stack;
        const isTypeOrmError = this.isTypeOrmConnectionError(errorMessage);
        const isRetryAttempt = this.isRetryAttempt(errorMessage);

        if (stack) {
            const error = optionalParams.find((param) => param instanceof Error) || new Error(errorMessage);
            Sentry.captureException(error, {
                tags: {
                    component: "logger",
                    errorType: isTypeOrmError ? "typeorm-connection" : "general",
                    isRetry: isRetryAttempt,
                },
                level: isRetryAttempt ? "warning" : "error",
            });
        } else {
            Sentry.captureMessage(errorMessage, {
                level: "error",
                tags: {
                    component: "logger",
                    errorType: isTypeOrmError ? "typeorm-connection" : "general",
                    isRetry: isRetryAttempt,
                },
            });
        }
    }

    warn(message: any, ...optionalParams: any[]): void {
        console.warn(message, ...optionalParams);

        const warnMessage = this.formatMessage(message, optionalParams);

        if (this.isImportantWarning(warnMessage)) {
            Sentry.captureMessage(warnMessage, {
                level: "warning",
                tags: {
                    component: "logger",
                    errorType: "warning",
                },
            });
        }
    }

    debug(message: any, ...optionalParams: any[]): void {
        if (process.env.NODE_ENV === "development") {
            console.debug(message, ...optionalParams);
        }
    }

    verbose(message: any, ...optionalParams: any[]): void {
        if (process.env.NODE_ENV === "development") {
            console.log(message, ...optionalParams);
        }
    }

    private formatMessage(message: any, optionalParams: any[]): string {
        const context = optionalParams.find((param) => typeof param === "string");
        const messageStr = typeof message === "object" ? JSON.stringify(message) : String(message);
        return context ? `[${context}] ${messageStr}` : messageStr;
    }

    private isTypeOrmConnectionError(message: string): boolean {
        return (
            message.includes("Unable to connect to the database") ||
            message.includes("Access denied") ||
            message.includes("ECONNREFUSED") ||
            message.includes("TypeOrmModule")
        );
    }

    private isRetryAttempt(message: string): boolean {
        return message.includes("Retrying");
    }

    private isImportantWarning(message: string): boolean {
        const keywords = ["error", "failed", "timeout", "connection", "database", "deprecated", "security"];
        const lowerMessage = message.toLowerCase();
        return keywords.some((keyword) => lowerMessage.includes(keyword));
    }
}

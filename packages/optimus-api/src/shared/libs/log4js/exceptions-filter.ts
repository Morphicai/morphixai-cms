import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";

import { Logger } from "./log4j.util";

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        // 安全地提取异常信息，避免访问undefined属性
        const exceptionMessage = this.extractExceptionMessage(exception);

        const logFormat = `-----------------------------------------------------------------------
Request original url: ${request.originalUrl}
Method: ${request.method}
IP: ${request.ip}
Status code: ${status}
Response: ${exceptionMessage}
-----------------------------------------------------------------------`;

        Logger.error(logFormat);

        // 检查响应是否已经发送，避免重复设置响应头
        if (!response.headersSent) {
            try {
                response.status(status).json({
                    code: status,
                    msg: `Service Error: ${exceptionMessage}`,
                });
            } catch (responseError) {
                // 如果发送响应失败，记录错误但不抛出异常
                Logger.error(`Failed to send error response: ${responseError.message}`);
            }
        } else {
            Logger.warn("Response headers already sent, cannot send error response");
        }
    }

    /**
     * 安全地提取异常信息
     * @param exception 异常对象
     * @returns 异常信息字符串
     */
    private extractExceptionMessage(exception: any): string {
        try {
            if (exception instanceof HttpException) {
                const response = exception.getResponse();
                if (typeof response === "string") {
                    return response;
                }
                if (typeof response === "object" && response !== null) {
                    return (response as any).message || exception.message || "Unknown HTTP exception";
                }
                return exception.message || "Unknown HTTP exception";
            }

            if (exception instanceof Error) {
                return exception.message || "Unknown error";
            }

            if (typeof exception === "string") {
                return exception;
            }

            if (typeof exception === "object" && exception !== null) {
                // 安全地访问对象属性
                return exception.message || exception.toString() || "Unknown object exception";
            }

            return "Unknown exception type";
        } catch (extractionError) {
            return "Exception message extraction failed";
        }
    }
}

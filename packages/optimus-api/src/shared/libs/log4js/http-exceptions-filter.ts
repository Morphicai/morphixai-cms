import { Catch, HttpException, ExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { Logger } from "./log4j.util";

@Catch(HttpException)
export class HttpExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const logFormat = `-----------------------------------------------------------------------
        Request original url: ${request.originalUrl}
        Method: ${request.method}
        IP: ${request.ip}
        Status code: ${status}
        Response: ${exception.toString() + `（${exceptionResponse?.message || exception.message}）`}
        -----------------------------------------------------------------------
        `;
        Logger.info(logFormat);

        // Extract meaningful message from exception response
        let msg = exception.message;
        if (exceptionResponse) {
            if (typeof exceptionResponse === "string") {
                msg = exceptionResponse;
            } else if (exceptionResponse.message) {
                msg = exceptionResponse.message;
            } else if (exceptionResponse.error) {
                msg = exceptionResponse.error;
            }
        }

        response.status(status).json({
            code: status,
            error: exceptionResponse?.message || exception.message,
            msg: msg,
        });
    }
}

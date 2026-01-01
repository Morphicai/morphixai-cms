import { CallHandler, ExecutionContext, NestInterceptor, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Logger } from "./log4j.util";
import { shouldLogResponseData } from "../../utils/env.util";

@Injectable()
export class TransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const req = context.getArgByIndex(1).req;
        return next.handle().pipe(
            map((data) => {
                // 根据环境变量配置决定是否记录响应数据
                if (shouldLogResponseData()) {
                    // 开发环境：记录完整信息（包括响应数据）
                    const logFormat = `-----------------------------------------------------------------------
                  Request original url: ${req.originalUrl}
                  Method: ${req.method}
                  IP: ${req.ip}
                  User: ${JSON.stringify(req.user)}
                  Response data: ${JSON.stringify(data.data)}
                  -----------------------------------------------------------------------`;
                    Logger.info(logFormat);
                    Logger.access(logFormat);
                } else {
                    // 生产环境：只记录请求信息，不记录响应数据（减少日志量）
                    const logFormat = `-----------------------------------------------------------------------
                  Request original url: ${req.originalUrl}
                  Method: ${req.method}
                  IP: ${req.ip}
                  User: ${JSON.stringify(req.user)}
                  Response size: ${JSON.stringify(data.data)?.length || 0} bytes
                  -----------------------------------------------------------------------`;
                    Logger.info(logFormat);
                    Logger.access(logFormat);
                }
                return data;
            }),
        );
    }
}

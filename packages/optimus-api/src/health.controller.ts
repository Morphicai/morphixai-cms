import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AllowAnonymous } from "./shared/decorators/allow-anonymous.decorator";

@ApiTags("健康检查")
@Controller()
export class HealthController {
    @Get()
    @ApiOperation({ summary: "健康检查" })
    @AllowAnonymous()
    health(): string {
        return "OK";
    }

    @Get("health")
    @ApiOperation({ summary: "详细健康检查" })
    @AllowAnonymous()
    healthCheck(): object {
        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
        };
    }

    @Get("api/debug-sentry")
    @ApiOperation({ summary: "测试 Sentry 错误上报" })
    @AllowAnonymous()
    testSentry(): void {
        throw new Error("My first Sentry error!");
    }
}

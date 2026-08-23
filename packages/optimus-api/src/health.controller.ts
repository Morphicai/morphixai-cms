import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AllowAnonymous } from "./shared/decorators/allow-anonymous.decorator";
import { AllowBeforeInitialization } from "./shared/decorators/allow-before-initialization.decorator";
import { metricsSnapshot } from "./shared/utils/request-stats";

@ApiTags("健康检查")
@Controller()
export class HealthController {
    @Get()
    @ApiOperation({ summary: "健康检查" })
    @AllowAnonymous()
    @AllowBeforeInitialization()
    health(): string {
        return "OK";
    }

    @Get("health")
    @ApiOperation({ summary: "详细健康检查" })
    @AllowAnonymous()
    @AllowBeforeInitialization()
    healthCheck(): object {
        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
        };
    }

    @Get("metrics-lite")
    @ApiOperation({ summary: "轻量进程指标(探测器消费)" })
    @AllowAnonymous()
    @AllowBeforeInitialization()
    // 匿名同 /health:内网探测面,生产网关只转发 /api,这条不出边界
    metricsLite(): object {
        return metricsSnapshot();
    }

    @Get("api/debug-sentry")
    @ApiOperation({ summary: "测试 Sentry 错误上报" })
    @AllowAnonymous()
    testSentry(): void {
        throw new Error("My first Sentry error!");
    }
}

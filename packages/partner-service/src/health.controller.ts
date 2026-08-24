import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AllowAnonymous } from "./shared/decorators/auth.decorators";
import { metricsSnapshot } from "./shared/utils/request-stats";

@ApiTags("健康检查")
@Controller()
export class HealthController {
    @Get("health")
    @ApiOperation({ summary: "健康检查(服务目录探测器消费)" })
    @AllowAnonymous()
    health(): object {
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
    metricsLite(): object {
        return metricsSnapshot();
    }
}

import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Perm } from "../../shared/decorators/perm.decorator";
import { ResultData } from "../../shared/utils/result";
import { ServiceEventService } from "./service-event.service";
import { ServiceProbeService } from "./service-probe.service";

/**
 * 服务治理接入面。
 * 读(状态/事件流)是运维视角,门是 ServiceOps;
 * 写事件的门是 AgentConsole——当前唯一事件源就是 agent run,发起人必有这个码,
 * 不为发事件单造一个权限。将来有非 agent 的事件源再议。
 */
@ApiTags("服务治理")
@Controller("system")
export class ServiceOpsController {
    constructor(
        private readonly events: ServiceEventService,
        private readonly probe: ServiceProbeService,
    ) {}

    @Get("services/status")
    @Perm("ServiceOps")
    @ApiOperation({ summary: "注册服务的探测状态(内存态,15s 一轮)" })
    status(): ResultData {
        return ResultData.ok(this.probe.getStatus());
    }

    @Get("events")
    @Perm("ServiceOps")
    @ApiOperation({ summary: "事件流:带 after 为游标消费(升序),否则最近 N 条(降序)" })
    async list(
        @Query("after") after?: string,
        @Query("type") type?: string,
        @Query("limit") limit?: string,
    ): Promise<ResultData> {
        const rows = await this.events.query({
            after: after !== undefined && after !== "" ? Number(after) : undefined,
            type: type || undefined,
            limit: limit ? Number(limit) : undefined,
        });
        return ResultData.ok(rows);
    }

    @Post("events")
    @Perm("AgentConsole")
    @ApiOperation({ summary: "发布服务事件(outbox 写入)" })
    async emit(
        @Body() body: { source?: string; type?: string; payload?: unknown },
        @Req() req: Request,
    ): Promise<ResultData> {
        const by = String((req as any).user?.account ?? "");
        const saved = await this.events.emit(String(body?.source ?? ""), String(body?.type ?? ""), body?.payload, by);
        return ResultData.ok({ id: saved.id });
    }
}

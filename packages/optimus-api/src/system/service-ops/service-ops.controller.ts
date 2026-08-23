import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AllowNoPerm, Perm } from "../../shared/decorators/perm.decorator";
import { ResultData } from "../../shared/utils/result";
import { ServiceEventService } from "./service-event.service";
import { ServiceProbeService } from "./service-probe.service";
import { ServiceEntry, ServiceRegistryService } from "./service-registry.service";

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
        private readonly registry: ServiceRegistryService,
    ) {}

    // ---- 服务目录:唯一接入面。注意路由顺序,具名子路径要在 :key 参数路由之前 ----

    @Get("services")
    @Perm("ServiceOps")
    @ApiOperation({ summary: "完整服务目录(治理视角)" })
    async listServices(): Promise<ResultData> {
        return ResultData.ok(await this.registry.list());
    }

    @Get("services/entries")
    @AllowNoPerm()
    @ApiOperation({ summary: "embed 入口条目(登录即可;前端据 permCode 过滤菜单,真正的门在子应用后端)" })
    async entries(): Promise<ResultData> {
        return ResultData.ok(await this.registry.listEmbedEntries());
    }

    @Get("services/tool-providers")
    @Perm("AgentConsole")
    @ApiOperation({ summary: "Agent 工具提供方(最小披露:key/baseUrl/toolsPath)" })
    async toolProviders(): Promise<ResultData> {
        return ResultData.ok(await this.registry.listToolProviders());
    }

    @Post("services")
    @Perm("ServiceOps")
    @ApiOperation({ summary: "登记服务" })
    async register(@Body() body: { key?: string } & ServiceEntry, @Req() req: Request): Promise<ResultData> {
        const { key, ...entry } = body ?? {};
        await this.registry.upsert(String(key ?? ""), entry as ServiceEntry, this.by(req));
        return ResultData.ok({ key });
    }

    @Put("services/:key")
    @Perm("ServiceOps")
    @ApiOperation({ summary: "更新服务登记" })
    async updateService(@Param("key") key: string, @Body() entry: ServiceEntry, @Req() req: Request): Promise<ResultData> {
        await this.registry.upsert(key, entry, this.by(req));
        return ResultData.ok({ key });
    }

    @Delete("services/:key")
    @Perm("ServiceOps")
    @ApiOperation({ summary: "下线服务登记" })
    async removeService(@Param("key") key: string, @Req() req: Request): Promise<ResultData> {
        await this.registry.remove(key, this.by(req));
        return ResultData.ok({ key });
    }

    private by(req: Request): string {
        return String((req as any).user?.account ?? "");
    }

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

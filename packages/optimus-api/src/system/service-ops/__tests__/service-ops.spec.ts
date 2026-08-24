/**
 * service-ops 单测:mock repo/fetch,钉住两条语义——
 * 事件查询的双语义(带 after 游标升序 / 不带 after 面板降序),
 * 探测器的聚合规则(enabled=false 跳过、下线服务状态清除、health 挂了 metrics 不拉)。
 */
import { BadRequestException } from "@nestjs/common";
import { ServiceEventService } from "../service-event.service";
import { ServiceProbeService } from "../service-probe.service";

const mkEventRepo = () => ({
    create: jest.fn().mockImplementation((r) => r),
    save: jest.fn().mockImplementation(async (r) => ({ id: 1, ...r })),
    find: jest.fn().mockResolvedValue([]),
});

describe("ServiceEventService", () => {
    it("emit 校验 source/type 格式,payload 超 4KB 拒绝", async () => {
        const svc = new ServiceEventService(mkEventRepo() as any);
        await expect(svc.emit("Bad Source", "x.y", null)).rejects.toThrow(BadRequestException);
        await expect(svc.emit("ok", "Bad Type!", null)).rejects.toThrow(BadRequestException);
        await expect(svc.emit("ok", "a.b", { big: "x".repeat(5000) })).rejects.toThrow(BadRequestException);
        await expect(svc.emit("agent-service", "agent.run.finished", { status: "success" }, "admin")).resolves.toMatchObject({ id: 1 });
    });

    it("带 after 是游标语义:id 升序;不带是面板语义:id 降序", async () => {
        const repo = mkEventRepo();
        const svc = new ServiceEventService(repo as any);

        await svc.query({ after: 10 });
        expect(repo.find).toHaveBeenLastCalledWith(expect.objectContaining({ order: { id: "ASC" } }));

        await svc.query({});
        expect(repo.find).toHaveBeenLastCalledWith(expect.objectContaining({ order: { id: "DESC" } }));
    });

    it("limit 被夹在 1..200", async () => {
        const repo = mkEventRepo();
        const svc = new ServiceEventService(repo as any);
        await svc.query({ limit: 9999 });
        expect(repo.find).toHaveBeenLastCalledWith(expect.objectContaining({ take: 200 }));
    });
});

describe("ServiceProbeService", () => {
    // probe 经 ServiceRegistryService.list() 读目录,mock 目录服务即可
    const rows = [
        { key: "api", name: "API", baseUrl: "http://a", healthPath: "/health", metricsPath: "/metrics-lite" },
        { key: "off", name: "OFF", baseUrl: "http://b", enabled: false },
        { key: "bad", name: "BAD", baseUrl: "http://c" },
    ];
    const mkRegistry = (r = rows) => ({ list: jest.fn().mockResolvedValue(r) });

    // jest27 的 node 环境不透传 Node18 全局 fetch,spyOn 不了,直接顶替再还原
    const realFetch = (global as any).fetch;
    afterEach(() => { (global as any).fetch = realFetch; });

    it("enabled=false 跳过;health ok 才拉 metrics;health 挂标记 error", async () => {
        (global as any).fetch = jest.fn().mockImplementation(async (url: any) => {
            const u = String(url);
            if (u.startsWith("http://a/health")) return { ok: true } as any;
            if (u.startsWith("http://a/metrics-lite")) return { ok: true, json: async () => ({ uptimeSec: 5 }) } as any;
            if (u.startsWith("http://c/health")) throw new Error("ECONNREFUSED");
            throw new Error(`unexpected fetch: ${u}`);
        });
        const svc = new ServiceProbeService(mkRegistry() as any);
        await svc.probeAll();

        const status = svc.getStatus();
        expect(status.map((s) => s.key).sort()).toEqual(["api", "bad"]);
        const api = status.find((s) => s.key === "api")!;
        expect(api.ok).toBe(true);
        expect(api.metrics).toEqual({ uptimeSec: 5 });
        const bad = status.find((s) => s.key === "bad")!;
        expect(bad.ok).toBe(false);
        expect(bad.error).toContain("ECONNREFUSED");
    });

    it("清单里删掉的服务,下一轮状态跟着消失", async () => {
        (global as any).fetch = jest.fn().mockResolvedValue({ ok: true } as any);
        const registry = mkRegistry();
        const svc = new ServiceProbeService(registry as any);
        await svc.probeAll();
        expect(svc.getStatus()).toHaveLength(2);

        registry.list.mockResolvedValue([rows[0]]);
        await svc.probeAll();
        expect(svc.getStatus().map((s) => s.key)).toEqual(["api"]);
    });
});

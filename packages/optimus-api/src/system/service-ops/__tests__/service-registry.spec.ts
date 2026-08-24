/**
 * 服务目录单测:钉住校验规则(URL 协议/用户信息段/字段联动/slug)、
 * 三个消费视图的过滤语义、事件旁路(发失败不影响登记)。
 * mock 形状 = op_sys_service_registry 专表实体行(平铺字段)。
 */
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ServiceRegistryService } from "../service-registry.service";

const rows = [
    { key: "api", sortOrder: 0, name: "API", baseUrl: "http://a/api", toolsPath: "/system/agent/tools" },
    { key: "app", sortOrder: 10, name: "APP", baseUrl: "http://b", entryType: "embed", embedUrl: "http://b/admin", permCode: "AppAdmin" },
    { key: "off", sortOrder: 20, name: "OFF", baseUrl: "http://c", enabled: false, toolsPath: "/t", entryType: "embed", embedUrl: "http://c/x" },
];

// findOne 按 where 等值条件在内存行里查,与真实 repo 行为对齐
const mkRepo = (r: any[] = rows) => ({
    find: jest.fn().mockResolvedValue(r),
    findOne: jest.fn().mockImplementation(async ({ where }: any) =>
        r.find((row) => Object.entries(where).every(([k, v]) => (row as any)[k] === v)) ?? null),
    save: jest.fn().mockImplementation(async (x) => x),
    create: jest.fn().mockImplementation((x) => x),
    remove: jest.fn(),
});
const mkEvents = () => ({ emit: jest.fn().mockResolvedValue({ id: 1 }) });
const svc = (repo: any = mkRepo(), events: any = mkEvents()) => new ServiceRegistryService(repo, events);

describe("ServiceRegistryService 校验", () => {
    const ok = { name: "X", baseUrl: "http://x:1/api" };

    it("key 需为小写 slug", async () => {
        await expect(svc().upsert("Bad Key", ok, "admin")).rejects.toThrow(BadRequestException);
    });

    it("baseUrl/embedUrl 仅 http(s),禁用户信息段", async () => {
        const s = svc();
        await expect(s.upsert("a", { name: "X", baseUrl: "file:///etc" }, "u")).rejects.toThrow(BadRequestException);
        await expect(s.upsert("a", { name: "X", baseUrl: "http://root:pw@x" }, "u")).rejects.toThrow(BadRequestException);
        await expect(
            s.upsert("a", { ...ok, entryType: "embed", embedUrl: "gopher://x" }, "u"),
        ).rejects.toThrow(BadRequestException);
    });

    it("entryType=embed 时 embedUrl 必填;path 字段需以 / 开头", async () => {
        const s = svc();
        await expect(s.upsert("a", { ...ok, entryType: "embed" }, "u")).rejects.toThrow(BadRequestException);
        await expect(s.upsert("a", { ...ok, toolsPath: "system/x" }, "u")).rejects.toThrow(BadRequestException);
    });

    it("合法登记走通,新建发 service.registered,更新发 service.updated", async () => {
        const data: any[] = [];
        const repo = mkRepo(data);
        const events = mkEvents();
        const s = svc(repo, events);
        await s.upsert("new-svc", ok, "admin");
        expect(events.emit).toHaveBeenLastCalledWith("optimus-api", "service.registered", expect.objectContaining({ key: "new-svc" }), "admin");

        data.push({ key: "new-svc", name: "X", baseUrl: "http://x:1/api" });
        await s.upsert("new-svc", ok, "admin");
        expect(events.emit).toHaveBeenLastCalledWith("optimus-api", "service.updated", expect.anything(), "admin");
    });

    it("事件发失败不影响登记(旁路)", async () => {
        const events = { emit: jest.fn().mockRejectedValue(new Error("db down")) };
        await expect(svc(mkRepo([]), events).upsert("a", ok, "u")).resolves.toBeUndefined();
    });

    it("删除不存在的服务抛 404", async () => {
        await expect(svc().remove("nope", "u")).rejects.toThrow(NotFoundException);
    });
});

describe("ServiceRegistryService zone 校验", () => {
    const ok = { name: "Z", baseUrl: "http://z:1" };

    it("zone 必填 pathPrefix,且需为单段小写路径", async () => {
        const s = svc();
        await expect(s.upsert("z", { ...ok, entryType: "zone" } as any, "u")).rejects.toThrow(BadRequestException);
        await expect(s.upsert("z", { ...ok, entryType: "zone", pathPrefix: "/a/b" } as any, "u")).rejects.toThrow(BadRequestException);
        await expect(s.upsert("z", { ...ok, entryType: "zone", pathPrefix: "activity" } as any, "u")).rejects.toThrow(BadRequestException);
    });

    it("主站保留路径不可登记为 zone 前缀", async () => {
        const s = svc();
        for (const p of ["/api", "/auth", "/embed"]) {
            await expect(s.upsert("z", { ...ok, entryType: "zone", pathPrefix: p } as any, "u")).rejects.toThrow(/保留/);
        }
    });

    it("pathPrefix 全域唯一,撞车报被谁占用", async () => {
        const taken = [{ key: "other", sortOrder: 0, name: "O", baseUrl: "http://o", entryType: "zone", pathPrefix: "/activity" }];
        const s = svc(mkRepo(taken));
        await expect(
            s.upsert("z", { ...ok, entryType: "zone", pathPrefix: "/activity" } as any, "u"),
        ).rejects.toThrow(/other/);
        // 同 key 更新自己不算撞车
        await expect(
            s.upsert("other", { ...ok, entryType: "zone", pathPrefix: "/activity" } as any, "u"),
        ).resolves.toBeUndefined();
    });

    it("listZoneRoutes 只出 enabled 的 zone 条目", async () => {
        const mixed = [
            { key: "z1", sortOrder: 0, name: "Z1", baseUrl: "http://z1", entryType: "zone", pathPrefix: "/activity" },
            { key: "z2", sortOrder: 1, name: "Z2", baseUrl: "http://z2", entryType: "zone", pathPrefix: "/blog", enabled: false },
            { key: "e1", sortOrder: 2, name: "E1", baseUrl: "http://e1", entryType: "embed", embedUrl: "http://e1" },
        ];
        const out = await svc(mkRepo(mixed)).listZoneRoutes();
        expect(out).toEqual([{ key: "z1", pathPrefix: "/activity", baseUrl: "http://z1" }]);
    });
});

describe("ServiceRegistryService 消费视图", () => {
    it("listToolProviders 只出 enabled 且有 toolsPath 的,最小披露三字段", async () => {
        const out = await svc().listToolProviders();
        expect(out).toEqual([{ key: "api", baseUrl: "http://a/api", toolsPath: "/system/agent/tools" }]);
    });

    it("listEmbedEntries 只出 enabled 且 entryType=embed 的,menuTitle 缺省用 name", async () => {
        const out = await svc().listEmbedEntries();
        expect(out).toHaveLength(1);
        expect(out[0]).toMatchObject({ key: "app", menuTitle: "APP", permCode: "AppAdmin", embedUrl: "http://b/admin" });
    });
});

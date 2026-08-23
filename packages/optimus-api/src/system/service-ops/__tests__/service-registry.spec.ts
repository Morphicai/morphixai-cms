/**
 * 服务目录单测:钉住校验规则(URL 协议/用户信息段/字段联动/slug)、
 * 三个消费视图的过滤语义、事件旁路(发失败不影响登记)。
 */
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ServiceRegistryService } from "../service-registry.service";

const rows = [
    { key: "api", sortOrder: 0, value: { name: "API", baseUrl: "http://a/api", toolsPath: "/system/agent/tools" } },
    { key: "app", sortOrder: 10, value: { name: "APP", baseUrl: "http://b", entryType: "embed", embedUrl: "http://b/admin", permCode: "AppAdmin" } },
    { key: "off", sortOrder: 20, value: { name: "OFF", baseUrl: "http://c", enabled: false, toolsPath: "/t", entryType: "embed", embedUrl: "http://c/x" } },
];

const mkRepo = (r: any[] = rows) => ({
    find: jest.fn().mockResolvedValue(r),
    findOne: jest.fn().mockResolvedValue(null),
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
        const repo = mkRepo();
        const events = mkEvents();
        const s = svc(repo, events);
        await s.upsert("new-svc", ok, "admin");
        expect(events.emit).toHaveBeenLastCalledWith("optimus-api", "service.registered", expect.objectContaining({ key: "new-svc" }), "admin");

        repo.findOne.mockResolvedValue({ key: "new-svc", value: {} });
        await s.upsert("new-svc", ok, "admin");
        expect(events.emit).toHaveBeenLastCalledWith("optimus-api", "service.updated", expect.anything(), "admin");
    });

    it("事件发失败不影响登记(旁路)", async () => {
        const events = { emit: jest.fn().mockRejectedValue(new Error("db down")) };
        await expect(svc(mkRepo(), events).upsert("a", ok, "u")).resolves.toBeUndefined();
    });

    it("删除不存在的服务抛 404", async () => {
        await expect(svc().remove("nope", "u")).rejects.toThrow(NotFoundException);
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

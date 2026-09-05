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

// find/findOne 都按 where 等值条件在内存行里查,与真实 repo 行为对齐——
// find 忽略 where 会让"查子节点"这类调用拿到全表,测试就测不出真实行为
const matches = (row: any, where: any) =>
    !where || Object.entries(where).every(([k, v]) => row[k] === v);
const mkRepo = (r: any[] = rows) => ({
    find: jest.fn().mockImplementation(async (opts?: any) => r.filter((row) => matches(row, opts?.where))),
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

describe("ServiceRegistryService apiPathPrefixes 校验", () => {
    const ok = { name: "P", baseUrl: "http://p:1" };

    it("需为 / 开头的小写分段路径,可多段", async () => {
        const s = svc();
        await expect(s.upsert("p", { ...ok, apiPathPrefixes: ["biz/partner"] } as any, "u")).rejects.toThrow(BadRequestException);
        await expect(s.upsert("p", { ...ok, apiPathPrefixes: ["/Biz/Partner"] } as any, "u")).rejects.toThrow(BadRequestException);
        await expect(s.upsert("p", { ...ok, apiPathPrefixes: ["/biz/partner", "/external-task"] } as any, "u")).resolves.toBeUndefined();
    });

    it("主服务保留路径(及其子路径)不可登记", async () => {
        const s = svc();
        for (const p of ["/auth", "/auth/refresh", "/public", "/login", "/embed"]) {
            await expect(s.upsert("p", { ...ok, apiPathPrefixes: [p] } as any, "u")).rejects.toThrow(/保留/);
        }
    });

    it("跨服务不重叠,撞车报被谁占用;同 key 更新自己不算撞车", async () => {
        const taken = [{ key: "other", sortOrder: 0, name: "O", baseUrl: "http://o", apiPathPrefixes: ["/biz/partner"] }];
        const s = svc(mkRepo(taken));
        await expect(
            s.upsert("p", { ...ok, apiPathPrefixes: ["/biz/partner"] } as any, "u"),
        ).rejects.toThrow(/other/);
        await expect(
            s.upsert("other", { ...ok, apiPathPrefixes: ["/biz/partner"] } as any, "u"),
        ).resolves.toBeUndefined();
    });

    it("listApiRoutes 只出 enabled 条目,一个服务多前缀展平成多行", async () => {
        const mixed = [
            { key: "s1", sortOrder: 0, name: "S1", baseUrl: "http://s1", apiPathPrefixes: ["/biz/partner", "/biz/points"] },
            { key: "s2", sortOrder: 1, name: "S2", baseUrl: "http://s2", apiPathPrefixes: ["/blog"], enabled: false },
            { key: "s3", sortOrder: 2, name: "S3", baseUrl: "http://s3" },
        ];
        const out = await svc(mkRepo(mixed)).listApiRoutes();
        expect(out).toEqual([
            { key: "s1", prefix: "/biz/partner", baseUrl: "http://s1" },
            { key: "s1", prefix: "/biz/points", baseUrl: "http://s1" },
        ]);
    });
});

describe("ServiceRegistryService 消费视图", () => {
    it("getByKey 只查询指定服务,不存在时返回 null", async () => {
        const repository = mkRepo();
        const service = svc(repository);
        await expect(service.getByKey("api")).resolves.toMatchObject({ key: "api", name: "API" });
        await expect(service.getByKey("missing")).resolves.toBeNull();
        expect(repository.findOne).toHaveBeenCalledWith({ where: { key: "missing" } });
    });

    it("listToolProviders 只出 enabled 且有 toolsPath 的,最小披露三字段", async () => {
        const out = await svc().listToolProviders();
        expect(out).toEqual([{ key: "api", baseUrl: "http://a/api", toolsPath: "/system/agent/tools" }]);
    });

    it("listEmbedEntries 只出 enabled 且 entryType=embed 的,menuTitle 缺省用 name", async () => {
        const out = await svc().listEmbedEntries();
        expect(out).toHaveLength(1);
        expect(out[0]).toMatchObject({ key: "app", menuTitle: "APP", permCode: "AppAdmin", embedUrl: "http://b/admin" });
    });

    it("无分组条目不带 children——向后兼容,形状与改动前一致", async () => {
        const out = await svc().listEmbedEntries();
        expect(out[0].children).toBeUndefined();
    });
});

describe("ServiceRegistryService embed 菜单分组", () => {
    const embed = (key: string, extra: any = {}) => ({
        key,
        sortOrder: 0,
        name: key.toUpperCase(),
        baseUrl: `http://${key}`,
        entryType: "embed",
        embedUrl: `http://${key}/admin`,
        ...extra,
    });

    it("单层分组:子条目挂到父的 children 下,不再出现在顶层", async () => {
        const out = await svc(
            mkRepo([embed("partner"), embed("partner-admin", { parentKey: "partner" }), embed("partner-task", { parentKey: "partner" })]),
        ).listEmbedEntries();
        expect(out.map((n) => n.key)).toEqual(["partner"]);
        expect(out[0].children?.map((c) => c.key)).toEqual(["partner-admin", "partner-task"]);
    });

    it("父节点可以是纯分组条目(没有 embedUrl,因此点击不跳转)", async () => {
        const out = await svc(
            mkRepo([
                { key: "grp", sortOrder: 0, name: "合伙人", baseUrl: "http://g", entryType: "none", menuIcon: "TeamOutlined" },
                embed("grp-a", { parentKey: "grp" }),
            ]),
        ).listEmbedEntries();
        expect(out).toHaveLength(1);
        expect(out[0]).toMatchObject({ key: "grp", menuTitle: "合伙人", menuIcon: "TeamOutlined" });
        expect(out[0].embedUrl).toBeUndefined();
        expect(out[0].children?.map((c) => c.key)).toEqual(["grp-a"]);
    });

    it("没有可见子节点的纯分组条目不出现——不留点不动的空壳", async () => {
        const out = await svc(
            mkRepo([{ key: "grp", sortOrder: 0, name: "空组", baseUrl: "http://g", entryType: "none" }]),
        ).listEmbedEntries();
        expect(out).toEqual([]);
    });

    // 让一条 enabled 的记录静默不可达是更糟的失败——会以为服务坏了
    it("父被禁用时,子节点提升到顶层而不是一起消失", async () => {
        const out = await svc(
            mkRepo([embed("partner", { enabled: false }), embed("partner-admin", { parentKey: "partner" })]),
        ).listEmbedEntries();
        expect(out.map((n) => n.key)).toEqual(["partner-admin"]);
        expect(out[0].children).toBeUndefined();
    });

    it("parentKey 指向不存在的记录时同样提升到顶层(直接改库能造出这种数据)", async () => {
        const out = await svc(mkRepo([embed("orphan", { parentKey: "ghost" })])).listEmbedEntries();
        expect(out.map((n) => n.key)).toEqual(["orphan"]);
    });

    it("子节点自身被禁用时只是它消失,父与兄弟不受影响", async () => {
        const out = await svc(
            mkRepo([embed("p"), embed("c1", { parentKey: "p" }), embed("c2", { parentKey: "p", enabled: false })]),
        ).listEmbedEntries();
        expect(out[0].children?.map((c) => c.key)).toEqual(["c1"]);
    });

    it("findEmbedNode 能在树里递归找到子节点", async () => {
        const tree = await svc(mkRepo([embed("p"), embed("c", { parentKey: "p" })])).listEmbedEntries();
        expect(ServiceRegistryService.findEmbedNode(tree, "c")?.embedUrl).toBe("http://c/admin");
        expect(ServiceRegistryService.findEmbedNode(tree, "p")?.key).toBe("p");
        expect(ServiceRegistryService.findEmbedNode(tree, "nope")).toBeUndefined();
    });
});

describe("ServiceRegistryService 父子关系校验", () => {
    const base = { name: "X", baseUrl: "http://x/api" };
    const row = (key: string, extra: any = {}) => ({ key, sortOrder: 0, name: key, baseUrl: `http://${key}`, ...extra });

    it("parentKey 指向不存在的记录 → 拒绝", async () => {
        await expect(svc(mkRepo([])).upsert("a", { ...base, parentKey: "ghost" }, "u")).rejects.toThrow(
            /parentKey 指向的服务不存在/,
        );
    });

    it("parentKey 指向自己 → 拒绝", async () => {
        await expect(svc(mkRepo([row("a")])).upsert("a", { ...base, parentKey: "a" }, "u")).rejects.toThrow(
            /不能指向自己/,
        );
    });

    // A→B 且 B→A 的环:因为 B 自己有 parentKey,它当不了父,这一条就把环挡住了
    it("父自己已归组 → 拒绝(同时挡住循环引用与三层嵌套)", async () => {
        const repo = mkRepo([row("a"), row("b", { parentKey: "a" })]);
        await expect(svc(repo).upsert("a", { ...base, parentKey: "b" }, "u")).rejects.toThrow(/只支持两层/);
    });

    it("自己已有子节点 → 不能再认父", async () => {
        const repo = mkRepo([row("p"), row("c", { parentKey: "p" }), row("top")]);
        await expect(svc(repo).upsert("p", { ...base, parentKey: "top" }, "u")).rejects.toThrow(
            /已有子菜单.*不能同时是别人的子节点/,
        );
    });

    it("合法归组写入成功,parentKey 落库", async () => {
        const repo = mkRepo([row("p")]);
        await svc(repo).upsert("c", { ...base, entryType: "embed", embedUrl: "http://c/x", parentKey: "p" }, "u");
        expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ key: "c", parentKey: "p" }));
    });

    it("不传 parentKey = 顶层,落库为 null", async () => {
        const repo = mkRepo([]);
        await svc(repo).upsert("a", base, "u");
        expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ parentKey: null }));
    });

    // 后台表单用空串表达"不归组",不归一就会存进一个非 NULL 又指不到任何记录的空字符串
    it.each(["", "   "])("parentKey 为空串/空白(%p)也落库为 null", async (blank) => {
        const repo = mkRepo([]);
        await svc(repo).upsert("a", { ...base, parentKey: blank }, "u");
        expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ parentKey: null }));
    });

    it("parentKey 两侧空白被去掉后仍能正确归组", async () => {
        const repo = mkRepo([row("p")]);
        await svc(repo).upsert("c", { ...base, entryType: "embed", embedUrl: "http://c/x", parentKey: " p " }, "u");
        expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ parentKey: "p" }));
    });

    // 级联删除会在删一条父记录时静默带走几条子记录,误伤不可撤销
    it("存在子节点时拒绝删除,并报出子节点 key", async () => {
        const repo = mkRepo([row("p"), row("c", { parentKey: "p" })]);
        await expect(svc(repo).remove("p", "u")).rejects.toThrow(/还有子菜单\(c\)/);
        expect(repo.remove).not.toHaveBeenCalled();
    });

    it("没有子节点时正常删除", async () => {
        const repo = mkRepo([row("solo")]);
        await svc(repo).remove("solo", "u");
        expect(repo.remove).toHaveBeenCalled();
    });
});

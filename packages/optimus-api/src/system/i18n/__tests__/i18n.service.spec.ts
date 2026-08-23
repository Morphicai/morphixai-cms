/**
 * i18n service 单测:mock repo,钉住核心约束——
 * 公开读的 zh-CN 回退、writeTranslation 只补缺失、(namespace,key) 入参校验。
 * (AI 翻译已全部走 agent-service,单轮批量翻译与其测试一并退役)
 */
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { I18nService } from "../i18n.service";

const mkRepo = (rows: any[] = []) => ({
    find: jest.fn().mockResolvedValue(rows),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation(async (r) => r),
    create: jest.fn().mockImplementation((r) => r),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
});

const svc = (repo: any) => new I18nService(repo as any);

describe("I18nService", () => {
    describe("publicRead", () => {
        const rows = [
            { key: "a", translations: { "zh-CN": "甲", "en-US": "A" } },
            { key: "b", translations: { "zh-CN": "乙" } },
            { key: "c", translations: {} },
        ];

        it("目标 locale 有译文用译文,缺失回退 zh-CN,全缺跳过", async () => {
            const out = await svc(mkRepo(rows)).publicRead("portal", "en-US");
            expect(out).toEqual({ a: "A", b: "乙" });
        });

        it("namespace 无键抛 404", async () => {
            await expect(svc(mkRepo([])).publicRead("nope", "zh-CN")).rejects.toThrow(NotFoundException);
        });
    });

    describe("create 校验", () => {
        it("非法 namespace 被拒", async () => {
            await expect(
                svc(mkRepo()).create({ namespace: "Bad_NS", key: "k", translations: { "zh-CN": "x" } }),
            ).rejects.toThrow(BadRequestException);
        });

        it("非法 locale 被拒", async () => {
            await expect(
                svc(mkRepo()).create({ namespace: "ns", key: "k", translations: { zhCN: "x" } as any }),
            ).rejects.toThrow(BadRequestException);
        });
    });

});

describe("agent 工具端点的业务逻辑", () => {
    const rows = [
        { key: "a", translations: { "zh-CN": "甲" }, remark: "备注A" },
        { key: "b", translations: { "zh-CN": "乙", "en-US": "Manual-B" }, remark: null },
    ];

    it("listMissing 只列缺目标语言且有源文的键", async () => {
        const out = await svc(mkRepo(rows)).listMissing("portal", "en-US");
        expect(out).toEqual([{ key: "a", source: "甲", remark: "备注A" }]);
    });

    it("writeTranslation 拒绝覆盖已有译文", async () => {
        const repo = mkRepo(rows);
        repo.findOne = jest.fn().mockResolvedValue(rows[1]);
        await expect(
            svc(repo).writeTranslation("portal", "b", "en-US", "Overwrite"),
        ).rejects.toThrow(BadRequestException);
        expect(rows[1].translations["en-US"]).toBe("Manual-B");
    });

    it("writeTranslation 补缺失成功", async () => {
        const repo = mkRepo(rows);
        const target = { key: "a", translations: { "zh-CN": "甲" }, remark: null };
        repo.findOne = jest.fn().mockResolvedValue(target);
        await svc(repo).writeTranslation("portal", "a", "en-US", "Alpha");
        expect(target.translations["en-US"]).toBe("Alpha");
    });
});

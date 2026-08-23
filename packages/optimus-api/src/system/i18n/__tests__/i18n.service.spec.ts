/**
 * i18n service 单测:mock repo 与 aiService,钉住三条硬约束——
 * 公开读的 zh-CN 回退、AI 补全不覆盖已有译文、(namespace,key) 入参校验。
 */
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { I18nService } from "../i18n.service";
import { ResultData } from "../../../shared/utils/result";

const mkRepo = (rows: any[] = []) => ({
    find: jest.fn().mockResolvedValue(rows),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation(async (r) => r),
    create: jest.fn().mockImplementation((r) => r),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
});

const mkAi = (result: string | null = null) => ({
    complete: jest.fn().mockResolvedValue(
        result === null ? ResultData.fail(502, "模型服务调用失败") : ResultData.ok({ result }),
    ),
});

const svc = (repo: any, ai: any = mkAi()) => new I18nService(repo as any, ai as any);

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

    describe("translateMissing", () => {
        it("只填缺失,不覆盖已有译文", async () => {
            const rows = [
                { key: "a", translations: { "zh-CN": "甲" }, remark: null },
                { key: "b", translations: { "zh-CN": "乙", "en-US": "Manual-B" }, remark: null },
            ];
            const repo = mkRepo(rows);
            const ai = mkAi(JSON.stringify({ a: "Alpha" }));
            const res = await svc(repo, ai).translateMissing("portal", ["en-US"]);

            expect(res.translated).toBe(1);
            // 模型只收到缺失的 a,已有人工译文的 b 不在请求里
            const prompt: string = ai.complete.mock.calls[0][0];
            expect(prompt).toContain('"a"');
            expect(prompt).not.toContain("Manual-B");
            // b 的人工译文原样保留
            expect(rows[1].translations["en-US"]).toBe("Manual-B");
            expect(rows[0].translations["en-US"]).toBe("Alpha");
        });

        it("模型失败带回原因,不抛异常", async () => {
            const rows = [{ key: "a", translations: { "zh-CN": "甲" }, remark: null }];
            const res = await svc(mkRepo(rows), mkAi(null)).translateMissing("portal", ["en-US"]);
            expect(res.failed).toContain("en-US");
        });

        it("模型输出裹了 markdown 代码块也能解析", async () => {
            const rows = [{ key: "a", translations: { "zh-CN": "甲" }, remark: null }];
            const ai = mkAi('```json\n{"a":"Alpha"}\n```');
            const res = await svc(mkRepo(rows), ai).translateMissing("portal", ["en-US"]);
            expect(res.translated).toBe(1);
        });

        it("targetLocales 为空被拒", async () => {
            await expect(svc(mkRepo()).translateMissing("portal", [])).rejects.toThrow(BadRequestException);
        });
    });
});

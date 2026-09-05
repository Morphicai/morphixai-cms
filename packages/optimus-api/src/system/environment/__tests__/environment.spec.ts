import { HttpException } from "@nestjs/common";
import { EnvironmentController, __resetRateBuckets } from "../environment.controller";
import { EnvironmentService, normalizeEnvironment } from "../environment.service";

const mkService = (values: Record<string, string | undefined>) =>
    new EnvironmentService({
        get: jest.fn().mockImplementation((key: string) => values[key]),
    } as any);

const mkReq = (ip = "10.0.0.1") => ({ ip }) as any;

describe("normalizeEnvironment", () => {
    it("把 NODE_ENV 的同义写法收敛成四个对外名字", () => {
        expect(normalizeEnvironment("development")).toBe("dev");
        expect(normalizeEnvironment("dev")).toBe("dev");
        expect(normalizeEnvironment("test")).toBe("test");
        expect(normalizeEnvironment("e2e")).toBe("test");
        expect(normalizeEnvironment("staging")).toBe("staging");
        expect(normalizeEnvironment("production")).toBe("prod");
    });

    it("大小写与空格不影响判定", () => {
        expect(normalizeEnvironment("  Development  ")).toBe("dev");
        expect(normalizeEnvironment("PRODUCTION")).toBe("prod");
    });

    it("不认识的值与空值一律归到 prod（判错方向的代价不对称）", () => {
        // 把生产误判成开发,消费方可能放宽 cookie 域或打开调试出口;反过来只是保守
        expect(normalizeEnvironment(undefined)).toBe("prod");
        expect(normalizeEnvironment("")).toBe("prod");
        expect(normalizeEnvironment("whatever")).toBe("prod");
    });
});

describe("EnvironmentService", () => {
    it("返回环境名、根域名与 cookie 域三项", () => {
        const info = mkService({
            NODE_ENV: "development",
            "app.file.domain": "http://localhost:8084",
            COOKIE_DOMAIN: "localhost",
        }).getInfo();

        expect(info).toEqual({
            environment: "dev",
            rootDomain: "http://localhost:8084",
            cookieDomain: "localhost",
        });
    });

    it("根域名优先取 config 的 app.file.domain（yml 正式条目，带默认值）", () => {
        // 两条历史读取路径取值可能不同,以配置系统的正式条目为准
        const info = mkService({
            NODE_ENV: "production",
            "app.file.domain": "https://cdn.example.com",
            SITE_DOMAIN: "http://stale-env-value",
        }).getInfo();
        expect(info.rootDomain).toBe("https://cdn.example.com");
    });

    it("config 没有条目时回落到裸环境变量 SITE_DOMAIN", () => {
        const info = mkService({ NODE_ENV: "production", SITE_DOMAIN: "https://from-env" }).getInfo();
        expect(info.rootDomain).toBe("https://from-env");
    });

    it("cookieDomain 留空是本地开发的正确状态,不做任何填充", () => {
        // host-only cookie 才能被 localhost 接收,配了域名反而被浏览器拒收
        const info = mkService({ NODE_ENV: "development", "app.file.domain": "http://localhost:8084" }).getInfo();
        expect(info.cookieDomain).toBe("");
    });

    it("未配置的域名返回空串而不是 undefined", () => {
        // 消费方多数直接做字符串拼接,undefined 会拼出 "undefined/path"
        const info = mkService({ NODE_ENV: "production" }).getInfo();
        expect(info.rootDomain).toBe("");
        expect(info.cookieDomain).toBe("");
        expect(info.environment).toBe("prod");
    });

    it("只读:不暴露任何其它配置项", () => {
        const info = mkService({
            NODE_ENV: "development",
            "app.file.domain": "http://x",
            COOKIE_DOMAIN: "x",
            JWT_SECRET: "must-not-leak",
            DATABASE_PASSWORD: "must-not-leak",
        }).getInfo();

        expect(Object.keys(info).sort()).toEqual(["cookieDomain", "environment", "rootDomain"]);
        expect(JSON.stringify(info)).not.toContain("must-not-leak");
    });
});

describe("EnvironmentController", () => {
    beforeEach(() => __resetRateBuckets());

    const mkController = () =>
        new EnvironmentController(
            mkService({
                NODE_ENV: "development",
                "app.file.domain": "http://localhost:8084",
                COOKIE_DOMAIN: "localhost",
            }),
        );

    it("正常查询返回 { environment, rootDomain, cookieDomain }", () => {
        const res = mkController().getEnvironment(mkReq());
        expect(res.data).toEqual({
            environment: "dev",
            rootDomain: "http://localhost:8084",
            cookieDomain: "localhost",
        });
    });

    it("单 IP 一分钟内超过 120 次被 429 拒绝", () => {
        const c = mkController();
        for (let i = 0; i < 120; i++) {
            expect(c.getEnvironment(mkReq("1.1.1.1")).data).toBeDefined();
        }
        expect(() => c.getEnvironment(mkReq("1.1.1.1"))).toThrow(HttpException);
    });

    it("限频按 IP 隔离:一个 IP 超限不影响其它 IP", () => {
        const c = mkController();
        for (let i = 0; i < 121; i++) {
            try {
                c.getEnvironment(mkReq("1.1.1.1"));
            } catch {
                /* 第 121 次超限,预期 */
            }
        }
        expect(c.getEnvironment(mkReq("2.2.2.2")).data).toBeDefined();
    });

    it("缺少 req.ip 时不抛错（按 unknown 计数）", () => {
        expect(mkController().getEnvironment({} as any).data).toBeDefined();
    });
});

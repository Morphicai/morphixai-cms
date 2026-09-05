import { JwtService } from "@nestjs/jwt";
import { hkdfSync } from "node:crypto";
import { ServiceTokenService, SERVICE_KEY_HKDF_SALT, SERVICE_KEY_HKDF_LENGTH } from "../service-token.service";

const MASTER = "unit-test-service-token-master-secret-which-is-not-a-real-secret";

/**
 * 与 @optimus/server-sdk 共享的 HKDF 测试向量。
 *
 * 两个包各实现一份派生函数（server-sdk 保持零依赖供外部团队独立安装，不能反过来
 * 依赖平台包），靠这组向量锚定：任何一边改了算法、salt 或长度，两边测试同时变红。
 * 修改这组值等于让所有已签发的 service token 失效，必须两个包同步改。
 * 对应用例见 packages/server-sdk/src/__tests__/index.test.ts。
 */
const HKDF_VECTOR_MASTER = "optimus-hkdf-test-vector-master-secret";
const HKDF_VECTORS: Record<string, string> = {
    "partner-service": "7683fd0ed2185187a7620fd9209f03ebec2b1324872a08a32953bbdc9922a863",
    "marketing-service": "68aa2907f47f533b4e4cad22bf63b1fbfb0cd7131a6f2774a21be8e7d9d1118a",
};

/** 测试侧独立实现一遍派生，避免直接调被测私有方法而把错误实现"自洽"地测过 */
const derive = (master: string, serviceKey: string): string =>
    Buffer.from(
        hkdfSync(
            "sha256",
            Buffer.from(master, "utf8"),
            Buffer.from(SERVICE_KEY_HKDF_SALT, "utf8"),
            Buffer.from(serviceKey, "utf8"),
            SERVICE_KEY_HKDF_LENGTH,
        ),
    ).toString("hex");

const makeService = (expiresIn: string | number = "5m") =>
    new ServiceTokenService(new JwtService({ secret: MASTER }), {
        get: jest.fn().mockImplementation((key: string, fallback?: unknown) => {
            if (key === "SERVICE_TOKEN_SECRET") return MASTER;
            if (key === "SERVICE_TOKEN_EXPIRES_IN") return expiresIn;
            return fallback;
        }),
    } as any);

describe("ServiceTokenService", () => {
    it("派生结果与共享测试向量一致", () => {
        for (const [serviceKey, expected] of Object.entries(HKDF_VECTORS)) {
            expect(derive(HKDF_VECTOR_MASTER, serviceKey)).toBe(expected);
        }
    });

    it("签发 service token 时包含正确的身份 payload，且用派生密钥签名", () => {
        const service = makeService();
        const token = service.issue("partner-service");

        const payload = new JwtService({ secret: derive(MASTER, "partner-service") }).verify(token) as any;
        expect(payload).toMatchObject({ sub: "partner-service", type: "service" });
        expect(payload.exp - payload.iat).toBe(300);
    });

    it("主密钥本身不能直接签出可用的 token", () => {
        const forged = new JwtService({ secret: MASTER }).sign({ sub: "partner-service", type: "service" });
        expect(makeService().verify(forged)).toBeNull();
    });

    it("持有某服务密钥也无法冒充其它服务", () => {
        // 攻击者持有 partner-service 的派生密钥，试图签发 sub=marketing-service 的 token。
        // 验签用的是 sub 所指服务的密钥，与签名者手里的对不上。
        const attackerSecret = derive(MASTER, "partner-service");
        const forged = new JwtService({ secret: attackerSecret }).sign({
            sub: "marketing-service",
            type: "service",
        });

        expect(makeService().verify(forged)).toBeNull();
    });

    it("自己的密钥签自己仍然有效（确认上一条不是因为全都验不过）", () => {
        const ownSecret = derive(MASTER, "partner-service");
        const token = new JwtService({ secret: ownSecret }).sign({ sub: "partner-service", type: "service" });

        expect(makeService().verify(token)).toMatchObject({ sub: "partner-service", type: "service" });
    });

    it("错误签名、错误类型和过期 token 都无法通过验证", () => {
        const service = makeService();
        const own = new JwtService({ secret: derive(MASTER, "partner-service") });
        const wrongSecret = new JwtService({ secret: "wrong-secret" });

        expect(service.verify(wrongSecret.sign({ sub: "partner-service", type: "service" }))).toBeNull();
        expect(service.verify(own.sign({ sub: "partner-service", type: "admin" }))).toBeNull();
        expect(service.verify(own.sign({ sub: "partner-service", type: "service" }, { expiresIn: -1 }))).toBeNull();
    });

    it("sub 不是合法 service key 的 token 直接拒绝", () => {
        const service = makeService();
        const jwt = new JwtService({ secret: MASTER });

        expect(service.verify(jwt.sign({ sub: "Partner Service", type: "service" }))).toBeNull();
        expect(service.verify(jwt.sign({ type: "service" }))).toBeNull();
        expect(service.verify("not-a-jwt")).toBeNull();
        expect(service.verify("")).toBeNull();
    });

    it("接受 Bearer 前缀", () => {
        const service = makeService();
        expect(service.verify(`Bearer ${service.issue("partner-service")}`)).toMatchObject({
            sub: "partner-service",
        });
    });

    it("不接受非法 service key", () => {
        expect(() => makeService().issue("Partner Service")).toThrow();
    });
});

import { JwtService } from "@nestjs/jwt";
import { ServiceTokenService } from "../service-token.service";

const SECRET = "unit-test-service-token-secret-which-is-not-a-real-secret";

const makeService = (expiresIn: string | number = "5m") =>
    new ServiceTokenService(
        new JwtService({ secret: SECRET }),
        { get: jest.fn().mockImplementation((_key: string, fallback?: unknown) => {
            if (_key === "SERVICE_TOKEN_SECRET") return SECRET;
            if (_key === "SERVICE_TOKEN_EXPIRES_IN") return expiresIn;
            return fallback;
        }) } as any,
    );

describe("ServiceTokenService", () => {
    it("签发 service token 时包含正确的身份 payload", () => {
        const service = makeService();
        const token = service.issue("partner-service");
        const payload = new JwtService({ secret: SECRET }).verify(token) as any;

        expect(payload).toMatchObject({ sub: "partner-service", type: "service" });
        expect(payload.exp - payload.iat).toBe(300);
    });

    it("错误签名、错误类型和过期 token 都无法通过验证", () => {
        const service = makeService();
        const jwt = new JwtService({ secret: SECRET });
        const wrongSecret = new JwtService({ secret: "wrong-secret" });

        expect(service.verify(wrongSecret.sign({ sub: "partner-service", type: "service" }))).toBeNull();
        expect(service.verify(jwt.sign({ sub: "partner-service", type: "admin" }))).toBeNull();
        expect(service.verify(jwt.sign({ sub: "partner-service", type: "service" }, { expiresIn: -1 }))).toBeNull();
    });

    it("不接受非法 service key", () => {
        expect(() => makeService().issue("Partner Service")).toThrow();
    });
});

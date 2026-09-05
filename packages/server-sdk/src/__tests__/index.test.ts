/**
 * server-sdk 单测:node 原生 test runner,构建后跑 dist。
 * 只测 SDK 自己的行为(缓存/错误分界),introspect 服务端逻辑由 api 的测试覆盖。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { OptimusServerSdk, deriveServiceSecret } from "../index";

function mockFetch(handler: () => Promise<Response>) {
    let calls = 0;
    (globalThis as any).fetch = async () => {
        calls += 1;
        return handler();
    };
    return () => calls;
}

const okResponse = (data: unknown) =>
    new Response(JSON.stringify({ code: 200, data }), { status: 200 });

test("缓存命中不发第二次请求", async () => {
    const calls = mockFetch(async () => okResponse({ active: true, type: "admin", perms: ["*"] }));
    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api", cacheTtlMs: 60000 });
    await sdk.introspect("t1", "admin");
    await sdk.introspect("t1", "admin");
    assert.equal(calls(), 1);
});

test("不同 token 不共享缓存", async () => {
    const calls = mockFetch(async () => okResponse({ active: false }));
    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api" });
    await sdk.introspect("t1");
    await sdk.introspect("t2");
    assert.equal(calls(), 2);
});

test("cacheTtlMs=0 关缓存", async () => {
    const calls = mockFetch(async () => okResponse({ active: false }));
    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api", cacheTtlMs: 0 });
    await sdk.introspect("t1");
    await sdk.introspect("t1");
    assert.equal(calls(), 2);
});

test("HTTP 非 200 抛错而不是返回 inactive", async () => {
    mockFetch(async () => new Response("busy", { status: 503 }));
    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api" });
    await assert.rejects(() => sdk.introspect("t1"), /introspect HTTP 503/);
});

test("hasPerm: 超管通配与普通码", async () => {
    mockFetch(async () => okResponse({ active: true, type: "admin", perms: ["FormManagement"] }));
    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api" });
    assert.equal(await sdk.hasPerm("t1", "FormManagement"), true);
    assert.equal(await sdk.hasPerm("t1", "Other"), false);

    mockFetch(async () => okResponse({ active: true, type: "admin", perms: ["*"] }));
    const sdk2 = new OptimusServerSdk({ baseUrl: "http://x/api" });
    assert.equal(await sdk2.hasPerm("t2", "Anything"), true);
});

test("getServiceToken: 生成带 service 身份且短期有效的 JWT", () => {
    const sdk = new OptimusServerSdk({
        baseUrl: "http://x/api",
        serviceTokenSecret: "unit-test-service-secret",
        serviceTokenExpiresIn: "5m",
    });
    const token = sdk.getServiceToken("partner-service");
    const [, encodedPayload] = token.split(".");
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

    assert.equal(payload.sub, "partner-service");
    assert.equal(payload.type, "service");
    assert.equal(payload.exp - payload.iat, 300);
});

test("getServiceToken: 缺少密钥或非法 key 时拒绝签发", () => {
    const withoutSecret = new OptimusServerSdk({ baseUrl: "http://x/api" });
    assert.throws(() => withoutSecret.getServiceToken("partner-service"), /SERVICE_TOKEN_SECRET/);

    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api", serviceTokenSecret: "secret" });
    assert.throws(() => sdk.getServiceToken("Partner Service"), /lowercase slug/);
});

/**
 * 与 optimus-api 共享的 HKDF 测试向量。
 *
 * 两个包各实现一份派生函数（本包保持零依赖供外部团队独立安装，不能反过来依赖
 * 平台包），靠这组向量锚定：任何一边改了算法、salt 或长度，两边测试同时变红。
 * 修改这组值等于让所有已签发的 service token 失效，必须两个包同步改。
 * 对应用例见 packages/optimus-api/src/system/auth/__tests__/service-token.service.spec.ts
 */
const HKDF_VECTOR_MASTER = "optimus-hkdf-test-vector-master-secret";
const HKDF_VECTORS: Record<string, string> = {
    "partner-service": "7683fd0ed2185187a7620fd9209f03ebec2b1324872a08a32953bbdc9922a863",
    "marketing-service": "68aa2907f47f533b4e4cad22bf63b1fbfb0cd7131a6f2774a21be8e7d9d1118a",
};

test("deriveServiceSecret: 与 optimus-api 共享的测试向量一致", () => {
    for (const [serviceKey, expected] of Object.entries(HKDF_VECTORS)) {
        assert.equal(deriveServiceSecret(HKDF_VECTOR_MASTER, serviceKey), expected);
    }
});

test("deriveServiceSecret: 不同服务派生出不同密钥，主密钥不等于任何派生密钥", () => {
    const master = "unit-test-service-secret";
    const a = deriveServiceSecret(master, "partner-service");
    const b = deriveServiceSecret(master, "order-service");

    assert.notEqual(a, b);
    assert.notEqual(a, master);
    // 确定性：同样输入必须得到同样输出，否则签发方和验签方对不上
    assert.equal(a, deriveServiceSecret(master, "partner-service"));
});

test("getServiceToken: 用派生密钥而非主密钥签名", () => {
    const master = "unit-test-service-secret";
    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api", serviceTokenSecret: master });
    const token = sdk.getServiceToken("partner-service");
    const [header, encodedPayload, signature] = token.split(".");
    const unsigned = `${header}.${encodedPayload}`;

    const withDerived = createHmac("sha256", deriveServiceSecret(master, "partner-service"))
        .update(unsigned)
        .digest("base64url");
    const withMaster = createHmac("sha256", master).update(unsigned).digest("base64url");

    assert.equal(signature, withDerived);
    assert.notEqual(signature, withMaster);
});

test("getServiceToken: 修改 sub 后签名不再匹配", () => {
    const master = "unit-test-service-secret";
    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api", serviceTokenSecret: master });
    const token = sdk.getServiceToken("partner-service");
    const [header, encodedPayload, signature] = token.split(".");
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    payload.sub = "order-service";
    const tamperedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

    // 平台验签时会用 sub 所指服务（order-service）的派生密钥，
    // 而签名是用 partner-service 的密钥算出来的，两者对不上——冒充失败。
    const expectedForVictim = createHmac("sha256", deriveServiceSecret(master, "order-service"))
        .update(`${header}.${tamperedPayload}`)
        .digest("base64url");
    assert.notEqual(signature, expectedForVictim);
});

test("verifyServiceToken: 只接受 active 的 service 身份，并带回 trustLevel 与 grants", async () => {
    const identity = {
        key: "partner-service",
        name: "合伙人服务",
        trustLevel: "first-party",
        grants: ["points:grant"],
    };
    mockFetch(async () => okResponse({ active: true, type: "service", service: identity }));
    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api", cacheTtlMs: 0 });
    const result = await sdk.verifyServiceToken("service-token");
    assert.deepEqual(result.service, identity);

    mockFetch(async () => okResponse({ active: true, type: "admin", perms: ["*"] }));
    const inactive = await sdk.verifyServiceToken("admin-token");
    assert.deepEqual(inactive, { active: false, type: "service" });
});

test("hasGrant: 按服务身份的 grants 判断，未授予即为 false", async () => {
    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api", cacheTtlMs: 0 });

    mockFetch(async () => okResponse({
        active: true,
        type: "service",
        service: { key: "partner-service", name: "合伙人服务", grants: ["points:grant"] },
    }));
    assert.equal(await sdk.hasGrant("t", "points:grant"), true);
    assert.equal(await sdk.hasGrant("t", "user-profile:read-full"), false);

    // grants 为空的三方服务：什么都不能做
    mockFetch(async () => okResponse({
        active: true,
        type: "service",
        service: { key: "vendor-service", name: "外包服务", trustLevel: "third-party", grants: [] },
    }));
    assert.equal(await sdk.hasGrant("t", "points:grant"), false);

    // 高权限用户 token 不能替服务提权：它不是 service 类型，直接不成立
    mockFetch(async () => okResponse({ active: true, type: "admin", perms: ["*"] }));
    assert.equal(await sdk.hasGrant("admin-token", "points:grant"), false);
});

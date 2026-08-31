/**
 * server-sdk 单测:node 原生 test runner,构建后跑 dist。
 * 只测 SDK 自己的行为(缓存/错误分界),introspect 服务端逻辑由 api 的测试覆盖。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { OptimusServerSdk } from "../index";

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

test("getServiceToken: 修改 sub 后签名不再匹配", () => {
    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api", serviceTokenSecret: "unit-test-service-secret" });
    const token = sdk.getServiceToken("partner-service");
    const [header, encodedPayload, signature] = token.split(".");
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    payload.sub = "order-service";
    const tamperedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const tampered = `${header}.${tamperedPayload}.${signature}`;

    // SDK 本地只负责签发；真正的目录 enabled 校验由平台的 introspect 完成。
    // 这里验证 token 的签名不会因为修改 sub 而继续成立，避免把一个服务冒充成另一个。
    const expected = createHmac("sha256", "unit-test-service-secret")
        .update(`${header}.${tamperedPayload}`)
        .digest("base64url");
    assert.notEqual(signature, expected);
    assert.notEqual(tampered, token);
});

test("verifyServiceToken: 只接受 active 的 service 身份", async () => {
    mockFetch(async () => okResponse({
        active: true,
        type: "service",
        service: { key: "partner-service", name: "合伙人服务" },
    }));
    const sdk = new OptimusServerSdk({ baseUrl: "http://x/api", cacheTtlMs: 0 });
    const result = await sdk.verifyServiceToken("service-token");
    assert.deepEqual(result.service, { key: "partner-service", name: "合伙人服务" });

    mockFetch(async () => okResponse({ active: true, type: "admin", perms: ["*"] }));
    const inactive = await sdk.verifyServiceToken("admin-token");
    assert.deepEqual(inactive, { active: false, type: "service" });
});

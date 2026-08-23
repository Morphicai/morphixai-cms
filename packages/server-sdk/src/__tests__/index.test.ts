/**
 * server-sdk 单测:node 原生 test runner,构建后跑 dist。
 * 只测 SDK 自己的行为(缓存/错误分界),introspect 服务端逻辑由 api 的测试覆盖。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
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

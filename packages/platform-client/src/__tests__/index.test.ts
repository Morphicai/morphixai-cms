/**
 * platform-client 单测：node 原生 test runner，构建后跑 dist（与 server-sdk 同款）。
 * 只测封装自己的行为——契约解包、字段归一、错误分界、缓存。
 * 平台侧的上传/短链逻辑由 optimus-api 的测试覆盖。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { PlatformClient, PlatformApiError, extractClientToken } from "../index";

interface Capture {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
}

function mockFetch(handler: (capture: Capture) => Promise<Response>) {
    const captures: Capture[] = [];
    (globalThis as any).fetch = async (url: string, init: any) => {
        const capture: Capture = { url, method: init?.method, headers: init?.headers, body: init?.body };
        captures.push(capture);
        return handler(capture);
    };
    return captures;
}

const ok = (data: unknown) => new Response(JSON.stringify({ code: 200, data }), { status: 200 });
const fail = (code: number, msg: string, status = 200) =>
    new Response(JSON.stringify({ code, msg }), { status });

const client = () => new PlatformClient({ baseUrl: "http://api.test/api/" });
const file = { buffer: new Uint8Array([1, 2, 3]), mimetype: "image/png", originalname: "a.png" };

test("baseUrl 尾斜杠被去掉，不会拼出双斜杠", async () => {
    const captures = mockFetch(async () => ok({ environment: "dev", rootDomain: "http://x", cookieDomain: "" }));
    await client().getEnvironment();
    assert.equal(captures[0].url, "http://api.test/api/environment");
});

test("缺 baseUrl 直接构造失败", () => {
    assert.throws(() => new PlatformClient({ baseUrl: "" }), /baseUrl is required/);
});

// —— 上传 ——

test("上传返回 url，并把 thumbnail_url / type 归一成驼峰", async () => {
    mockFetch(async () =>
        ok([{ url: "/OSS_FILE_PROXY/a.png", thumbnail_url: "/t/a.png", type: "image/png", size: 3, fileKey: "k", ossKey: "o", cdnUrl: "https://cdn/a.png" }]),
    );
    const r = await client().uploadFile(file, { token: "ct" });
    assert.equal(r.url, "/OSS_FILE_PROXY/a.png");
    assert.equal(r.thumbnailUrl, "/t/a.png");
    assert.equal(r.mimeType, "image/png");
    assert.equal(r.size, 3);
    assert.equal(r.fileKey, "k");
    assert.equal(r.ossKey, "o");
    assert.equal(r.cdnUrl, "https://cdn/a.png");
    assert.equal((r.raw as any).url, "/OSS_FILE_PROXY/a.png");
});

test("上传带 Bearer 前缀的 Authorization，且只加一次", async () => {
    const captures = mockFetch(async () => ok([{ url: "/u" }]));
    await client().uploadFile(file, { token: "ct" });
    assert.equal(captures[0].headers?.Authorization, "Bearer ct");
});

test("needThumbnail=false 不出现在表单里（Boolean('false') 是 true，传了就反了）", async () => {
    const captures = mockFetch(async () => ok([{ url: "/u" }]));
    await client().uploadFile(file, { token: "ct", needThumbnail: false });
    assert.equal((captures[0].body as FormData).has("needThumbnail"), false);
});

test("needThumbnail=true 传字符串 'true'", async () => {
    const captures = mockFetch(async () => ok([{ url: "/u" }]));
    await client().uploadFile(file, { token: "ct", needThumbnail: true });
    assert.equal((captures[0].body as FormData).get("needThumbnail"), "true");
});

test("未传的可选参数不出现在表单里（避免被平台按 0 解读）", async () => {
    const captures = mockFetch(async () => ok([{ url: "/u" }]));
    await client().uploadFile(file, { token: "ct" });
    const form = captures[0].body as FormData;
    for (const key of ["business", "width", "height", "quality"]) {
        assert.equal(form.has(key), false, `${key} 不该出现`);
    }
    assert.equal(form.has("file"), true);
});

test("width=0 这类假值仍然被发送", async () => {
    const captures = mockFetch(async () => ok([{ url: "/u" }]));
    await client().uploadFile(file, { token: "ct", width: 0 });
    assert.equal((captures[0].body as FormData).get("width"), "0");
});

test("上传成功但响应缺 url，报错而不是返回空串", async () => {
    mockFetch(async () => ok([{ thumbnail_url: "/t" }]));
    await assert.rejects(() => client().uploadFile(file, { token: "ct" }), /没有 url/);
});

test("上传缺 token 在发请求前就失败", async () => {
    const captures = mockFetch(async () => ok([{ url: "/u" }]));
    await assert.rejects(() => client().uploadFile(file, { token: "" }), /token is required/);
    assert.equal(captures.length, 0);
});

// —— 短链 ——

test("短链返回 token 与站点相对路径，不替消费方拼域名", async () => {
    mockFetch(async () => ok({ token: "abc", url: "/public/short-link/resolve/abc" }));
    const r = await client().createShortLink({ token: "ct", target: { a: "1" }, remark: "推广" });
    assert.deepEqual(r, { token: "abc", url: "/public/short-link/resolve/abc" });
});

test("短链请求体是 {target, remark}", async () => {
    const captures = mockFetch(async () => ok({ token: "abc", url: "/u" }));
    await client().createShortLink({ token: "ct", target: "https://x", remark: "r" });
    assert.deepEqual(JSON.parse(captures[0].body as string), { target: "https://x", remark: "r" });
    assert.equal(captures[0].headers?.["Content-Type"], "application/json");
});

test("短链缺 target 在发请求前就失败", async () => {
    const captures = mockFetch(async () => ok({ token: "abc" }));
    await assert.rejects(() => client().createShortLink({ token: "ct", target: "" }), /target is required/);
    assert.equal(captures.length, 0);
});

test("短链响应缺 token 报错", async () => {
    mockFetch(async () => ok({ url: "/u" }));
    await assert.rejects(() => client().createShortLink({ token: "ct", target: "x" }), /未返回 token/);
});

// —— 环境信息 ——

test("环境信息原样返回三个字段", async () => {
    mockFetch(async () => ok({ environment: "staging", rootDomain: "https://s.example", cookieDomain: ".example" }));
    assert.deepEqual(await client().getEnvironment(), {
        environment: "staging",
        rootDomain: "https://s.example",
        cookieDomain: ".example",
    });
});

test("认不出的环境名归到 prod（与平台侧同方向）", async () => {
    mockFetch(async () => ok({ environment: "wat", rootDomain: "", cookieDomain: "" }));
    assert.equal((await client().getEnvironment()).environment, "prod");
});

test("字段缺失时给空串而不是 undefined", async () => {
    mockFetch(async () => ok({ environment: "dev" }));
    const r = await client().getEnvironment();
    assert.equal(r.rootDomain, "");
    assert.equal(r.cookieDomain, "");
});

test("环境信息命中缓存不发第二次请求", async () => {
    const captures = mockFetch(async () => ok({ environment: "dev", rootDomain: "", cookieDomain: "" }));
    const c = client();
    await c.getEnvironment();
    await c.getEnvironment();
    assert.equal(captures.length, 1);
});

test("clearCache 后重新请求", async () => {
    const captures = mockFetch(async () => ok({ environment: "dev", rootDomain: "", cookieDomain: "" }));
    const c = client();
    await c.getEnvironment();
    c.clearCache();
    await c.getEnvironment();
    assert.equal(captures.length, 2);
});

test("environmentCacheTtlMs=0 关缓存", async () => {
    const captures = mockFetch(async () => ok({ environment: "dev", rootDomain: "", cookieDomain: "" }));
    const c = new PlatformClient({ baseUrl: "http://api.test/api", environmentCacheTtlMs: 0 });
    await c.getEnvironment();
    await c.getEnvironment();
    assert.equal(captures.length, 2);
});

// —— 错误分界 ——

test("平台业务失败抛 PlatformApiError，带 endpoint/status/code", async () => {
    mockFetch(async () => fail(401, "未登录", 200));
    await assert.rejects(
        () => client().createShortLink({ token: "ct", target: "x" }),
        (e: unknown) => {
            assert.ok(e instanceof PlatformApiError);
            assert.equal(e.endpoint, "/system/short-link/client-shorten");
            assert.equal(e.code, 401);
            assert.equal(e.status, 200);
            assert.equal(e.message, "未登录");
            return true;
        },
    );
});

test("响应体不是 JSON（网关 HTML 错误页）也给可诊断的错误", async () => {
    mockFetch(async () => new Response("<html>502</html>", { status: 502 }));
    await assert.rejects(
        () => client().getEnvironment(),
        (e: unknown) => {
            assert.ok(e instanceof PlatformApiError);
            assert.equal(e.status, 502);
            assert.match(e.message, /HTTP 502/);
            return true;
        },
    );
});

test("网络失败原样抛出，不包装成 PlatformApiError——重试策略由调用方定", async () => {
    mockFetch(async () => {
        throw new TypeError("fetch failed");
    });
    await assert.rejects(
        () => client().getEnvironment(),
        (e: unknown) => {
            assert.ok(!(e instanceof PlatformApiError));
            assert.ok(e instanceof TypeError);
            return true;
        },
    );
});

// —— token 提取 ——

test("extractClientToken：header 优先", () => {
    const token = extractClientToken({
        headers: { authorization: "Bearer h" },
        cookies: { clientAccessToken: "c" },
    });
    assert.equal(token, "h");
});

test("extractClientToken：无 header 时回落 cookie", () => {
    assert.equal(extractClientToken({ cookies: { clientAccessToken: "c" } }), "c");
});

test("extractClientToken：非 Bearer 的 header 不当作 token", () => {
    assert.equal(extractClientToken({ headers: { authorization: "Basic xyz" } }), undefined);
});

test("extractClientToken：空请求不抛错", () => {
    assert.equal(extractClientToken(undefined), undefined);
    assert.equal(extractClientToken({}), undefined);
});

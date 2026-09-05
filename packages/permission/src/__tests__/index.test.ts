/**
 * permission 核心单测：node 原生 test runner，构建后跑 dist（与 server-sdk 同款）。
 * 覆盖 spec 全部场景 + 边界。这是纯函数包，没有 mock，测试即规格。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
    parse, validate, validateGrant, format, matches,
    evaluate, can, canAny, definePermissions, belongsTo, holdsCode,
    type Subject, type EvaluateRule,
} from "../index";

const admin = (...codes: string[]): Subject => ({ type: "admin", codes });
const service = (...codes: string[]): Subject => ({ type: "service", codes });

// ───────────────── parse / validate ─────────────────

test("解析合法三段码", () => {
    const r = parse("partner:campaign:write");
    assert.equal(r.ok, true);
    assert.deepEqual(r.ok && { ...r, ok: undefined }, { ok: undefined, namespace: "partner", resource: "campaign", action: "write" });
});

test("段数不对时指出收到几段", () => {
    for (const bad of ["partner", "partner:campaign", "a:b:c:d"]) {
        const r = parse(bad);
        assert.equal(r.ok, false, bad);
        assert.match((r as any).reason, /三段/);
    }
});

test("解析失败能指出是哪一段不合法", () => {
    assert.equal((parse("Partner:campaign:write") as any).segment, "namespace");
    assert.equal((parse("partner:Campaign:write") as any).segment, "resource");
    assert.equal((parse("partner:campaign:Write") as any).segment, "action");
});

test("空段 / 空串 / 非字符串一律不合法", () => {
    for (const bad of ["", "::", "partner::write", ":campaign:write", null, undefined, 42, {}]) {
        assert.equal(validate(bad as unknown), false, String(bad));
    }
});

test("段首必须是字母，长度上限 50", () => {
    assert.equal(validate("1partner:campaign:read"), false);
    assert.equal(validate("-partner:campaign:read"), false);
    assert.equal(validate(`${"a".repeat(50)}:campaign:read`), true);
    assert.equal(validate(`${"a".repeat(51)}:campaign:read`), false);
});

test("中划线合法，下划线与点不合法", () => {
    assert.equal(validate("partner-service:user-profile:read-basic"), true);
    assert.equal(validate("partner_service:campaign:read"), false);
    assert.equal(validate("partner.service:campaign:read"), false);
});

// required 侧不接受通配 —— 否则声明方可以用通配放宽自己的门槛
test("具体码解析不接受通配，且理由点明原因", () => {
    const r = parse("partner:campaign:*");
    assert.equal(r.ok, false);
    assert.match((r as any).reason, /通配/);
});

test("format 是 parse 的逆", () => {
    const r = parse("partner:campaign:write");
    assert.ok(r.ok);
    assert.equal(format(r), "partner:campaign:write");
});

// ───────────────── validateGrant（授予侧，允许后缀通配） ─────────────────

test("授予侧接受后缀通配", () => {
    for (const g of ["a:b:c", "a:b:*", "a:*", "a:*:*", "*"]) {
        assert.equal(validateGrant(g), true, g);
    }
});

test("授予侧拒绝中缀通配——命名空间边界不能被跨越", () => {
    for (const g of ["*:campaign:read", "*:*:read", "partner:*:read", "*:b:*"]) {
        assert.equal(validateGrant(g), false, g);
    }
});

test("两段形态必须以通配收尾", () => {
    assert.equal(validateGrant("partner:*"), true);
    assert.equal(validateGrant("partner:campaign"), false);
});

// ───────────────── matches ─────────────────

test("精确匹配", () => {
    assert.equal(matches("partner:campaign:write", "partner:campaign:write"), true);
    assert.equal(matches("partner:campaign:read", "partner:campaign:write"), false);
});

test("后缀通配覆盖", () => {
    assert.equal(matches("partner:campaign:*", "partner:campaign:write"), true);
    assert.equal(matches("partner:*", "partner:campaign:write"), true);
    assert.equal(matches("partner:*:*", "partner:settlement:approve"), true);
});

test("全局通配覆盖一切合法要求", () => {
    assert.equal(matches("*", "partner:campaign:write"), true);
    assert.equal(matches("*", "platform:user:read"), true);
});

test("不跨命名空间", () => {
    assert.equal(matches("partner:*", "order:refund:approve"), false);
    assert.equal(matches("partner:campaign:*", "partner:settlement:read"), false);
});

test("中缀通配的授予不匹配任何要求", () => {
    assert.equal(matches("*:campaign:read", "partner:campaign:read"), false);
});

// 要求侧写通配 = 声明方自己放宽门槛，必须挡掉
test("required 含通配一律不匹配", () => {
    assert.equal(matches("*", "partner:campaign:*"), false);
    assert.equal(matches("partner:campaign:*", "partner:campaign:*"), false);
    assert.equal(matches("partner:*", "partner:*"), false);
});

test("非法输入不抛错，只是不匹配", () => {
    assert.equal(matches(null, "a:b:c"), false);
    assert.equal(matches("a:b:c", undefined), false);
    assert.equal(matches(42, {}), false);
});

// ───────────────── evaluate ─────────────────

test("持有覆盖该要求的码 → allowed，并给出命中的那条", () => {
    const d = evaluate(admin("other:x:y", "partner:campaign:*"), "partner:campaign:write");
    assert.equal(d.allowed, true);
    assert.equal(d.matched, "partner:campaign:*");
    assert.equal(d.scope, "all");
});

test("不持有 → 拒绝，且带可入日志的原因", () => {
    const d = evaluate(admin("order:refund:approve"), "partner:campaign:write");
    assert.equal(d.allowed, false);
    assert.equal(d.matched, undefined);
    assert.ok(d.reason);
});

test("空 codes fail-closed", () => {
    assert.equal(evaluate(admin(), "partner:campaign:write").allowed, false);
});

// 判定失败和程序崩溃是两回事：拼错的码不该让守卫抛 500
test("非法 required fail-closed 且不抛异常", () => {
    for (const bad of ["Partner:campaign:write", "partner:campaign", "partner:campaign:*", "", null]) {
        const d = evaluate(admin("*"), bad as unknown);
        assert.equal(d.allowed, false, String(bad));
        assert.match(d.reason!, /不合法/);
    }
});

test("缺主体 / codes 不是数组 → 拒绝而不抛", () => {
    assert.equal(evaluate(null, "a:b:c").allowed, false);
    assert.equal(evaluate(undefined, "a:b:c").allowed, false);
    assert.equal(evaluate({ type: "admin", codes: "nope" } as never, "a:b:c").allowed, false);
});

test("超管 * 通吃", () => {
    assert.equal(can(admin("*"), "anything:goes:here"), true);
});

test("主体类型不改变判定结果——service 与 admin 同码同结论", () => {
    const code = "user-profile:read-basic:x";
    assert.equal(
        can(admin(code), code),
        can(service(code), code),
    );
    assert.equal(can(service("partner:campaign:*"), "partner:campaign:write"), true);
});

// ───────────────── canAny ─────────────────

test("canAny 任一命中即可", () => {
    const s = admin("partner:settlement:read");
    assert.equal(canAny(s, ["partner:campaign:read", "partner:settlement:read"]), true);
    assert.equal(canAny(s, ["partner:campaign:read", "order:refund:approve"]), false);
});

// 这条容易写反：空数组直觉像"无限制"，实际语义必须是最严
test("canAny 空数组 fail-closed，超管也不例外", () => {
    assert.equal(canAny(admin("*"), []), false);
    assert.equal(canAny(admin("*"), undefined as never), false);
});

// ───────────────── 规则链 ─────────────────

test("可以追加规则，任一返回非 null 即采纳", () => {
    const always: EvaluateRule = function always() {
        return { allowed: true, scope: "own" as const, matched: "custom" };
    };
    const d = evaluate(admin("nope:nope:nope"), "partner:campaign:write", { rules: [holdsCode, always] });
    assert.equal(d.allowed, true);
    assert.equal(d.scope, "own");
});

// codes 为空的短路属于 holdsCode 而不是 evaluate：将来"资源归属于自己"这类规则
// 与 codes 无关，一个 codes 为空但拥有资源的人应该由那条规则决定
test("codes 为空时仍进规则链，自定义规则有机会放行", () => {
    const owner: EvaluateRule = function owner() {
        return { allowed: true, scope: "own" as const, matched: "owner" };
    };
    assert.equal(evaluate(admin(), "partner:campaign:write", { rules: [holdsCode, owner] }).allowed, true);
    // 默认规则链下行为不变
    assert.equal(evaluate(admin(), "partner:campaign:write").allowed, false);
});

test("codes 不是数组时 holdsCode 跳过而不抛", () => {
    assert.equal(holdsCode({ type: "admin", codes: "nope" } as never, "a:b:c"), null);
    assert.equal(evaluate({ type: "admin", codes: "nope" } as never, "a:b:c").allowed, false);
});

test("默认规则链只有 holdsCode", () => {
    assert.equal(holdsCode.name, "holdsCode");
    assert.equal(holdsCode(admin("a:b:c"), "a:b:c")?.allowed, true);
    assert.equal(holdsCode(admin("a:b:c"), "x:y:z"), null);
});

// ───────────────── definePermissions ─────────────────

test("声明产出带类型的常量与扁平清单", () => {
    const P = definePermissions("partner", {
        campaign: ["read", "write", "publish"],
        settlement: ["read", "approve"],
    });
    assert.equal(P.campaign.write, "partner:campaign:write");
    assert.equal(P.settlement.approve, "partner:settlement:approve");
    assert.equal(P.$namespace, "partner");
    assert.deepEqual([...P.$all], [
        "partner:campaign:read", "partner:campaign:write", "partner:campaign:publish",
        "partner:settlement:read", "partner:settlement:approve",
    ]);
});

test("产出的码全部能通过 validate", () => {
    const P = definePermissions("partner-service", { "user-profile": ["read-basic"] });
    for (const code of P.$all) assert.equal(validate(code), true, code);
});

// 声明是启动期行为，此时抛错远好过运行期静默 403
test("非法 namespace / resource / action 在声明时抛错", () => {
    assert.throws(() => definePermissions("Partner", { a: ["read"] }), /namespace/);
    assert.throws(() => definePermissions("partner", { Campaign: ["read"] }), /resource/);
    assert.throws(() => definePermissions("partner", { campaign: ["Read"] }), /action/);
    assert.throws(() => definePermissions("partner", { campaign: [] }), /至少要声明一个 action/);
    assert.throws(() => definePermissions("partner", null as never), /spec/);
});

test("产出对象冻结，防止运行期被改", () => {
    const P = definePermissions("partner", { campaign: ["read"] });
    assert.throws(() => { (P as never as Record<string, unknown>).campaign = {}; }, TypeError);
});

// ───────────────── belongsTo ─────────────────

// 这是"子应用不能声明宽松码蹭可见性"的唯一防线
test("belongsTo 做归属校验", () => {
    assert.equal(belongsTo("partner:campaign:read", "partner"), true);
    assert.equal(belongsTo("platform:user:read", "partner"), false);
    assert.equal(belongsTo("Dashboard", "partner"), false);
    assert.equal(belongsTo("partner:*", "partner"), false, "通配不是具体码，不参与归属登记");
});

test("声明出的全部码都属于本命名空间", () => {
    const P = definePermissions("partner", { campaign: ["read"], settlement: ["approve"] });
    assert.ok(P.$all.every((c) => belongsTo(c, "partner")));
});

// ───────────────── 可跨环境 ─────────────────

test("不依赖任何 node 内置模块（浏览器可用）", () => {
    // 读的是编译产物而非源码：源码里没 import 不代表产物里没有
    // （tslib、helper 注入都可能在编译期冒出来）
    const src = readFileSync(join(__dirname, "..", "index.js"), "utf8");
    const requires = [...src.matchAll(/require\(["']([^"']+)["']\)/g)].map((m) => m[1]);
    assert.deepEqual(requires, [], `不应有任何运行时 require，实际: ${requires.join(", ")}`);
});

// ───────────────── 类型承诺 ─────────────────

// 没有 `const S` 修饰的话，["read","write"] 会退化成 string[]，
// 产出类型变成 `partner:campaign:${string}`，拼错编译器不报——DSL 的类型承诺就是空的
test("声明产出的是字面量类型，不是模板串", () => {
    const P = definePermissions("partner", { campaign: ["read", "write"] });
    const exact: "partner:campaign:write" = P.campaign.write;
    assert.equal(exact, "partner:campaign:write");
    // @ts-expect-error 拼错的 action 必须在编译期被抓到
    const typo = P.campaign.writ;
    assert.equal(typo, undefined);
});

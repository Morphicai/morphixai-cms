/**
 * Optimus 权限判定核心。
 *
 * 一句话：把「这个人/这个服务能不能做这件事」收敛成一个纯函数，
 * 让 optimus-api 守卫、业务子服务守卫、管理端菜单过滤、子应用 iframe 内部
 * **四处跑同一份逻辑**。现在这行判断各存一份，必然漂移。
 *
 * 零运行时依赖、不碰任何 node 内置模块——它要能在浏览器里跑，
 * 也要能被平台外的团队独立安装（同 `@optimus/server-sdk` 的取舍）。
 *
 * 本包**只判定，不获取**：codes 从哪来（introspect / embed 握手 / 服务目录）
 * 是消费方的事。这条边界让它可以在没有网络的地方被测试和使用。
 *
 * 完整设计见 docs/PERMISSION_MODEL.html。
 */

/** 码的三段与每段的约束。小写 slug——大小写敏感的权限码是排障噩梦 */
const SEGMENT_RE = /^[a-z][a-z0-9-]{0,49}$/;
const WILDCARD = "*";

export type PermissionSegment = "namespace" | "resource" | "action";

export interface ParsedPermission {
    namespace: string;
    resource: string;
    action: string;
}

export interface ParseFailure {
    ok: false;
    /** 出错的是哪一段;整体形态不对时为 undefined */
    segment?: PermissionSegment;
    reason: string;
}

export type ParseResult = ({ ok: true } & ParsedPermission) | ParseFailure;

const SEGMENT_NAMES: PermissionSegment[] = ["namespace", "resource", "action"];

/**
 * 解析一个**具体**的三段码(不含通配)。
 * 通配形态请用 `validateGrant` —— 两者的合法集合不同,混用会让
 * "要求"也能写成通配,那等于让声明方自己放宽门槛。
 */
export function parse(code: unknown): ParseResult {
    if (typeof code !== "string" || code.length === 0) {
        return { ok: false, reason: "权限码必须是非空字符串" };
    }
    const parts = code.split(":");
    if (parts.length !== 3) {
        return { ok: false, reason: `权限码必须是 namespace:resource:action 三段,收到 ${parts.length} 段` };
    }
    for (let i = 0; i < 3; i++) {
        const seg = parts[i];
        if (!SEGMENT_RE.test(seg)) {
            return {
                ok: false,
                segment: SEGMENT_NAMES[i],
                reason: seg === WILDCARD
                    ? `${SEGMENT_NAMES[i]} 不能是通配符——"要求"必须是具体的`
                    : `${SEGMENT_NAMES[i]} 需为小写 slug(字母开头,≤50 字),收到 ${JSON.stringify(seg)}`,
            };
        }
    }
    return { ok: true, namespace: parts[0], resource: parts[1], action: parts[2] };
}

/** 具体码是否合法。要求(required)侧用这个 */
export function validate(code: unknown): boolean {
    return parse(code).ok;
}

export function format(p: ParsedPermission): string {
    return `${p.namespace}:${p.resource}:${p.action}`;
}

/**
 * 已授予的码是否合法。比 `validate` 宽:允许**后缀通配**。
 *
 * 合法：`a:b:c` / `a:b:*` / `a:*` / `a:*:*` / `*`
 * 非法：`*:b:c`、`a:*:c` —— **中缀通配不支持**。
 *
 * 拒绝中缀是有意的:命名空间边界是整套设计的安全支点(一个服务只能声明自己
 * namespace 下的码)。允许 `*:campaign:read` 就等于开了一个绕过归属校验的口子。
 */
export function validateGrant(code: unknown): boolean {
    if (typeof code !== "string" || code.length === 0) return false;
    if (code === WILDCARD) return true;

    const parts = code.split(":");
    if (parts.length !== 2 && parts.length !== 3) return false;

    // 通配一旦出现,其后必须全是通配——这正是"只允许后缀通配"
    let seenWildcard = false;
    for (const seg of parts) {
        if (seg === WILDCARD) {
            seenWildcard = true;
            continue;
        }
        if (seenWildcard) return false; // 通配后面又出现具体段 = 中缀通配
        if (!SEGMENT_RE.test(seg)) return false;
    }
    // 两段形态必须以通配收尾(`a:*`),否则 `a:b` 语义不明
    if (parts.length === 2 && parts[1] !== WILDCARD) return false;
    return true;
}

/**
 * 已授予的码是否覆盖被要求的码。
 *
 * required **不接受通配**:"要求"必须是具体的,否则一个接口声明
 * `@RequirePermission("partner:campaign:*")` 就等于要求"任意活动权限",
 * 语义含糊且容易被当成"任意一个就行"。
 */
export function matches(granted: unknown, required: unknown): boolean {
    const req = parse(required);
    if (!req.ok) return false;
    if (!validateGrant(granted)) return false;

    const g = granted as string;
    if (g === WILDCARD) return true;

    const parts = g.split(":");
    const target = [req.namespace, req.resource, req.action];
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === WILDCARD) return true; // 后缀通配,其后不必再比
        if (parts[i] !== target[i]) return false;
    }
    return parts.length === 3;
}

/** 代表调用者的身份。三种类型共用判定逻辑,但 codes 的来源互不相通 */
export type SubjectType = "admin" | "client" | "service";

export interface Subject {
    type: SubjectType;
    /**
     * 已授予的码。
     * - admin/client：来自 op_sys_role_menu
     * - service：来自服务目录的 grants
     *
     * **来源隔离是信任模型的红线**：service 的 codes 不会因为它转发了一个
     * 管理员 token 而变多。本包不负责获取 codes，隔离由消费方保证。
     */
    codes: string[];
}

/** 数据范围。第一版恒为 all——平台只判"能不能做",范围由子服务按领域模型翻译 */
export type PermissionScope = "own" | "team" | "all";

export interface Decision {
    allowed: boolean;
    /** 命中的是哪一条已授予的码。排障时省去"到底哪个码放行的"这一步猜测 */
    matched?: string;
    scope: PermissionScope;
    /** 拒绝原因。仅用于日志,不要回给终端用户——那是在给探测者画地图 */
    reason?: string;
}

export interface EvaluateRule {
    name: string;
    (subject: Subject, required: string): Decision | null;
}

/**
 * 默认且目前唯一的规则:持有覆盖该要求的码。
 *
 * 用**具名函数表达式**而不是 `Object.assign(fn, { name })` —— 函数的 `name`
 * 是 writable:false 的,赋值在严格模式下直接抛 TypeError(编译成 CJS 后就是严格模式)。
 */
export const holdsCode: EvaluateRule = function holdsCode(subject: Subject, required: string): Decision | null {
    if (!Array.isArray(subject.codes)) return null;
    for (const code of subject.codes) {
        if (matches(code, required)) {
            return { allowed: true, matched: code, scope: "all" };
        }
    }
    return null;
};

export interface EvaluateOptions {
    /**
     * 判定规则链,任一条返回非 null 即采纳。默认 `[holdsCode]`。
     *
     * 留这个口子是为了将来接"且资源归属于自己"这类条件判定,
     * **刻意不预先实现**——现在写的形状大概率不是届时需要的那个。
     */
    rules?: EvaluateRule[];
}

const DEFAULT_RULES: EvaluateRule[] = [holdsCode];

/**
 * 判定入口。
 *
 * 返回对象而非 boolean 是有意的:数据范围(scope)是迟早要加的一维,
 * 一开始就返回对象,后面加 scope 不用改所有调用点。
 *
 * **任何异常情况都 fail-closed 且不抛错**:拼错的码、缺失的主体、非法的要求,
 * 结果都是"不允许"。判定失败和程序崩溃是两回事——让守卫因为一个拼错的码
 * 抛出 500,比返回 403 更糟。
 */
export function evaluate(subject: Subject | null | undefined, required: unknown, options?: EvaluateOptions): Decision {
    const deny = (reason: string): Decision => ({ allowed: false, scope: "all", reason });

    const req = parse(required);
    if (!req.ok) return deny(`要求的权限码不合法: ${req.reason}`);
    if (!subject) return deny("缺少主体");

    // 刻意**不**在这里短路"codes 为空"。那是 holdsCode 这一条规则的判据,不是
    // evaluate 的：将来接入的规则(如"资源归属于自己")可能与 codes 无关,
    // 一个 codes 为空但拥有资源的人应该由那条规则决定,而不是在进规则链之前就被判死。
    const requiredCode = format(req);
    for (const rule of options?.rules ?? DEFAULT_RULES) {
        const decision = rule(subject, requiredCode);
        if (decision) return decision;
    }
    return deny("主体不持有覆盖该要求的权限码");
}

/** `evaluate(...).allowed` 的简写。菜单过滤这类只关心真假的地方用它 */
export function can(subject: Subject | null | undefined, required: unknown, options?: EvaluateOptions): boolean {
    return evaluate(subject, required, options).allowed;
}

/**
 * 任一命中即可。菜单节点的 `requires` 是数组(一个页面常聚合多种资源),
 * 用这个判断。
 *
 * **空数组返回 false**——"没声明要求"必须是最严而不是不限制。
 * 这条容易写反:空数组直觉上像"无限制",而实际语义必须是"只有超管可见"。
 */
export function canAny(subject: Subject | null | undefined, required: readonly unknown[], options?: EvaluateOptions): boolean {
    if (!Array.isArray(required) || required.length === 0) return false;
    return required.some((r) => can(subject, r, options));
}

/** definePermissions 的入参:资源名 → 该资源支持的动作列表 */
export type PermissionSpec = Record<string, readonly string[]>;

export type DefinedPermissions<N extends string, S extends PermissionSpec> = {
    readonly [R in keyof S & string]: {
        readonly [A in S[R][number] & string]: `${N}:${R}:${A}`;
    };
} & {
    /** 命名空间 */
    readonly $namespace: N;
    /** 扁平清单,注册到平台时上报用 */
    readonly $all: readonly string[];
};

/**
 * 声明本服务的权限。放在服务自己的代码里,与实现同库同版本、过 code review。
 *
 * ```ts
 * export const P = definePermissions('partner', {
 *   campaign: ['read', 'write', 'publish'],
 * });
 * P.campaign.write   // → "partner:campaign:write",带类型,拼错编译期就报
 * P.$all             // → 上报给平台注册
 * ```
 *
 * 非法的 namespace / resource / action **在声明时就抛错**:声明是启动期行为,
 * 此时抛错远好过运行期静默失效(拼错的码表现为"莫名其妙 403",很难想到是配置问题)。
 *
 * `const S` 这个修饰不能删:没有它,`["read","write"]` 会被推断成 `string[]`,
 * 产出的类型退化成 `` `partner:campaign:${string}` `` —— `P.campaign.writ` 这种拼错
 * **编译器不报**,整个 DSL 的类型承诺就是空的。有测试钉住这一点。
 */
export function definePermissions<N extends string, const S extends PermissionSpec>(
    namespace: N,
    spec: S,
): DefinedPermissions<N, S> {
    if (!SEGMENT_RE.test(namespace)) {
        throw new Error(`namespace 需为小写 slug(字母开头,≤50 字): ${JSON.stringify(namespace)}`);
    }
    if (!spec || typeof spec !== "object") {
        throw new Error("spec 需为 { resource: [action...] } 形态的对象");
    }

    const out: Record<string, Record<string, string>> = {};
    const all: string[] = [];
    for (const [resource, actions] of Object.entries(spec)) {
        if (!SEGMENT_RE.test(resource)) {
            throw new Error(`resource 需为小写 slug: ${JSON.stringify(resource)}`);
        }
        if (!Array.isArray(actions) || actions.length === 0) {
            throw new Error(`resource ${resource} 至少要声明一个 action`);
        }
        const bucket: Record<string, string> = {};
        for (const action of actions) {
            if (!SEGMENT_RE.test(action)) {
                throw new Error(`action 需为小写 slug: ${resource}.${JSON.stringify(action)}`);
            }
            const code = `${namespace}:${resource}:${action}`;
            bucket[action] = code;
            all.push(code);
        }
        out[resource] = Object.freeze(bucket);
    }

    return Object.freeze(
        Object.assign(out, { $namespace: namespace, $all: Object.freeze(all) }),
    ) as unknown as DefinedPermissions<N, S>;
}

/**
 * 一个码是否属于某命名空间。平台注册子服务声明的码时用它做归属校验——
 * **这是"子应用不能声明宽松码蹭可见性"的唯一防线**,比一整套批准流程更简单也更严密。
 */
export function belongsTo(code: unknown, namespace: string): boolean {
    const p = parse(code);
    return p.ok && p.namespace === namespace;
}

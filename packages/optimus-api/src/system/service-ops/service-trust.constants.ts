/**
 * 服务信任模型的常量与默认授权集。
 *
 * 三个概念各管一件事,不要混用:
 * - 用户权限码(perm_code + CASL) —— 这个**人**能做什么
 * - 信任级别(trustLevel)         —— 这个服务的**代码提供方**有多可信
 * - 能力授权(grants)             —— 这个**服务**能访问什么
 *
 * 信任级别只提供新登记服务的默认授权集,以及与级别绑定的硬约束;
 * **运行时的授权判据始终是 grants**,不是级别。这是刻意的:
 * "可以访问什么"必须是可配置的,不能焊死在级别上。
 */

export const SERVICE_TRUST_LEVELS = ["first-party", "second-party", "third-party"] as const;

export type ServiceTrustLevel = (typeof SERVICE_TRUST_LEVELS)[number];

export const DEFAULT_TRUST_LEVEL: ServiceTrustLevel = "first-party";

/**
 * 首批 grant code。只定义确实已有消费方的项——新增一个 grant 成本很低,
 * 预先设计一整套权限体系成本很高,而且大概率设计的不是实际需要的那套。
 */
export const GRANT_CODES = [
    "user-profile:read-basic",
    "user-profile:read-full",
    "points:grant",
    "oss:upload",
    "shortlink:create",
] as const;

export type GrantCode = (typeof GRANT_CODES)[number];

/**
 * 各信任级别的默认授权集。
 *
 * third-party **默认为空**:外部供应商的每一项能力都必须显式授予,
 * 不存在"因为登记了所以自动能用"的能力。
 */
export const DEFAULT_GRANTS_BY_TRUST_LEVEL: Record<ServiceTrustLevel, string[]> = {
    "first-party": [...GRANT_CODES],
    "second-party": ["user-profile:read-basic", "oss:upload", "shortlink:create"],
    "third-party": [],
};

export function isServiceTrustLevel(value: unknown): value is ServiceTrustLevel {
    return SERVICE_TRUST_LEVELS.includes(value as ServiceTrustLevel);
}

export function defaultGrantsFor(trustLevel: ServiceTrustLevel): string[] {
    return [...(DEFAULT_GRANTS_BY_TRUST_LEVEL[trustLevel] ?? [])];
}

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceRegistryEntity } from "./service-registry.entity";
import { ServiceEventService } from "./service-event.service";
import {
    DEFAULT_TRUST_LEVEL,
    GRANT_CODES,
    ServiceTrustLevel,
    defaultGrantsFor,
    isServiceTrustLevel,
} from "./service-trust.constants";

/** 目录条目——服务的自我声明。存储为 op_sys_service_registry 专表一行 */
export interface ServiceEntry {
    name: string;
    baseUrl: string;
    healthPath?: string;
    metricsPath?: string;
    enabled?: boolean;
    /** 入口形态:none=无入口;embed=iframe 嵌入管理基座;zone=C 端路径分区(Multi-Zones) */
    entryType?: "none" | "embed" | "zone";
    embedUrl?: string;
    menuTitle?: string;
    menuIcon?: string;
    /** 访问权限码。空=仅 ServiceOps 可见,缺省从紧 */
    permCode?: string;
    /** Agent 工具声明端点(相对路径) */
    toolsPath?: string;
    /** zone 专用:该 zone 负责的 URL 前缀(全域唯一),主 zone 据此生成 rewrites */
    pathPrefix?: string;
    /**
     * API 请求路由前缀(可多个),C 端代理据此把 /api/xxx 转发到对应服务,
     * 而不是清一色转给 optimus-api。与 pathPrefix 是独立概念,互不影响
     */
    apiPathPrefixes?: string[];
    /** 代码提供方可信程度。缺省 first-party;三方服务必须显式声明 */
    trustLevel?: ServiceTrustLevel;
    /** 该服务被授予的平台能力。缺省按 trustLevel 取默认集,三方默认为空 */
    grants?: string[];
    /** 归到哪条记录之下(另一条记录的 key)。空=顶层。只支持两层,父必须是顶层记录 */
    parentKey?: string;
}

/** embed 菜单节点。父节点可以没有 embedUrl(纯分组,点击只展开) */
export interface EmbedMenuNode {
    key: string;
    menuTitle: string;
    menuIcon?: string;
    permCode?: string;
    /** 纯分组节点没有这个字段 */
    embedUrl?: string;
    children?: EmbedMenuNode[];
}

const KEY_RE = /^[a-z][a-z0-9-]{0,49}$/;
const PERM_RE = /^[A-Za-z][A-Za-z0-9]{0,49}$/;
// 单段小写前缀:/activity 合法,/a/b 不合法——zone 边界是业务域,一段足矣,
// 多段前缀会让 assetPrefix 约定(prefix + "-static")和唯一性判断复杂化
const PREFIX_RE = /^\/[a-z][a-z0-9-]{0,49}$/;
// 主站自身占用的一级路径,zone 前缀撞上会把主站流量劫走(proxy 里 zone 匹配先于页面路由)
const RESERVED_PREFIXES = ["/api", "/auth", "/embed"];
// API 路径前缀允许多段(如 /biz/partner),但仍要求小写 slug 分段
const API_PREFIX_RE = /^\/[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/;
// C 端代理自身逻辑占用的路径,登记成 apiPathPrefixes 会劫走鉴权/自省这些核心请求
const API_RESERVED_PREFIXES = ["/auth", "/public", "/login", "/embed"];

/** 实体 → 对外条目形状(null 列还原为 undefined,消费方判断逻辑不用感知 DB 表示) */
function toEntry(row: ServiceRegistryEntity): { key: string; sortOrder: number } & ServiceEntry {
    return {
        key: row.key,
        sortOrder: row.sortOrder,
        name: row.name,
        baseUrl: row.baseUrl,
        healthPath: row.healthPath ?? undefined,
        metricsPath: row.metricsPath ?? undefined,
        toolsPath: row.toolsPath ?? undefined,
        enabled: row.enabled,
        entryType: row.entryType,
        embedUrl: row.embedUrl ?? undefined,
        menuTitle: row.menuTitle ?? undefined,
        menuIcon: row.menuIcon ?? undefined,
        permCode: row.permCode ?? undefined,
        pathPrefix: row.pathPrefix ?? undefined,
        apiPathPrefixes: row.apiPathPrefixes ?? undefined,
        trustLevel: row.trustLevel ?? DEFAULT_TRUST_LEVEL,
        // 空数组和"没配"要区分开:三方服务的空 grants 是有意义的状态(什么都不许),
        // 还原成 undefined 会让消费方误以为该取默认集
        grants: Array.isArray(row.grants) ? row.grants : [],
        parentKey: row.parentKey ?? undefined,
    };
}

/**
 * 服务目录:唯一事实源,探测/菜单/Agent 工具/zone 路由四个消费者读同一份数据。
 * 存储在专表 op_sys_service_registry(见 entity 注释:与通用字典物理隔离,防误删)。
 * 校验在这里而不靠 form schema——URL 协议、字段联动这类规则 form 协议表达不了,
 * 而且这个接入面必须自己站得住,不能依赖"数据恰好是从受校验的入口进来的"。
 */
@Injectable()
export class ServiceRegistryService {
    constructor(
        @InjectRepository(ServiceRegistryEntity)
        private readonly repo: Repository<ServiceRegistryEntity>,
        private readonly events: ServiceEventService,
    ) {}

    /** 完整目录(治理视角,ServiceOps 门后使用) */
    async list(): Promise<Array<{ key: string; sortOrder: number } & ServiceEntry>> {
        return (await this.rows()).map(toEntry);
    }

    /** 按服务 key 查询目录。认证等平台内核场景只需要这一行,避免每次拉取完整目录。 */
    async getByKey(key: string): Promise<({ key: string; sortOrder: number } & ServiceEntry) | null> {
        const row = await this.repo.findOne({ where: { key } });
        return row ? toEntry(row) : null;
    }

    /**
     * embed 入口条目,按 parentKey 聚合成树(登录即可读,前端据 permCode 过滤菜单;
     * 真正的门在子应用后端)。
     *
     * 返回的是**树**,不是平铺数组——按 key 找某一条时要递归,别只扫第一层。
     * `findEmbedNode()` 就是干这个的。
     *
     * 三条规则值得记住:
     * 1. 父节点可以不是 embed 条目(纯分组,点击只展开)。只要有可见子节点就会出现
     * 2. 父节点 disabled 时,子节点**提升到顶层**而不是一起消失。让一条 enabled 的
     *    记录静默不可达是更糟的失败——会以为服务坏了;要隐藏子项就各自 disable。
     *    同一条规则顺带兜住"parentKey 指向不存在的记录"(直接改库能造出这种数据)
     * 3. 顺序沿用 rows() 的 sortOrder/id,子节点在父节点内保持同样的相对顺序
     */
    async listEmbedEntries(): Promise<EmbedMenuNode[]> {
        const all = (await this.rows()).map(toEntry).filter((e) => e.enabled !== false);
        const visibleKeys = new Set(all.map((e) => e.key));
        const embeddable = all.filter((e) => e.entryType === "embed" && e.embedUrl);

        const toNode = (e: (typeof all)[number]): EmbedMenuNode => ({
            key: e.key,
            menuTitle: e.menuTitle || e.name,
            menuIcon: e.menuIcon,
            permCode: e.permCode,
            embedUrl: e.embedUrl,
        });

        // 谁被当作父引用了(且父自身可见)——纯分组节点靠这个被带进结果
        const parentKeys = new Set(
            embeddable
                .map((e) => e.parentKey)
                .filter((k): k is string => !!k && visibleKeys.has(k)),
        );

        // 有父且父可见 = 归组;父不可见/不存在的一律按顶层处理(规则 2)
        const isGrouped = (e: (typeof all)[number]) => !!e.parentKey && visibleKeys.has(e.parentKey);

        const nodes = new Map<string, EmbedMenuNode>();
        const roots: EmbedMenuNode[] = [];
        for (const e of all) {
            const isEmbeddable = e.entryType === "embed" && !!e.embedUrl;
            if (!isEmbeddable && !parentKeys.has(e.key)) continue;
            if (isGrouped(e)) continue;
            const node = toNode(e);
            nodes.set(e.key, node);
            roots.push(node);
        }

        for (const e of embeddable) {
            if (!isGrouped(e)) continue;
            const parent = nodes.get(e.parentKey!);
            if (parent) (parent.children ??= []).push(toNode(e));
        }
        return roots;
    }

    /** 在 listEmbedEntries() 的树里按 key 找一条(含子节点)。 */
    static findEmbedNode(tree: EmbedMenuNode[], key: string): EmbedMenuNode | undefined {
        for (const node of tree) {
            if (node.key === key) return node;
            const hit = node.children && ServiceRegistryService.findEmbedNode(node.children, key);
            if (hit) return hit;
        }
        return undefined;
    }

    /** 工具提供方(AgentConsole 门,最小披露:只给工具发现需要的三个字段) */
    async listToolProviders(): Promise<Array<{ key: string; baseUrl: string; toolsPath: string }>> {
        return (await this.rows())
            .map(toEntry)
            .filter((e) => e.enabled !== false && e.toolsPath)
            .map(({ key, baseUrl, toolsPath }) => ({ key, baseUrl, toolsPath: toolsPath! }));
    }

    /** zone 路由表(主 zone 的 proxy 按 TTL 拉取;匿名接口消费,只出这三个字段) */
    async listZoneRoutes(): Promise<Array<{ key: string; pathPrefix: string; baseUrl: string }>> {
        return (await this.rows())
            .map(toEntry)
            .filter((e) => e.enabled !== false && e.entryType === "zone" && e.pathPrefix)
            .map(({ key, pathPrefix, baseUrl }) => ({ key, pathPrefix: pathPrefix!, baseUrl }));
    }

    /**
     * API 路由表(C 端 /api/[...path] 代理按 TTL 拉取)。一个服务可声明多个前缀,
     * 按 entryType 无关——不要求走 embed/zone,纯粹是"这段 API 路径归谁处理"的声明,
     * 展平成 {key, prefix, baseUrl}[],命中即转发,和 zone 页面路由完全独立判断
     */
    async listApiRoutes(): Promise<Array<{ key: string; prefix: string; baseUrl: string }>> {
        return (await this.rows())
            .map(toEntry)
            .filter((e) => e.enabled !== false && e.apiPathPrefixes?.length)
            .flatMap(({ key, apiPathPrefixes, baseUrl }) => apiPathPrefixes!.map((prefix) => ({ key, prefix, baseUrl })));
    }

    async upsert(key: string, entry: ServiceEntry, by: string): Promise<void> {
        if (!KEY_RE.test(key)) throw new BadRequestException("key 需为小写 slug(≤50字)");
        this.validate(entry);
        // zone 前缀全域唯一:两个 zone 抢同一段路径,路由只会命中一个,另一个静默失效。
        // 应用层先查是为了报出占用者;DB 唯一索引兜底并发窗口
        if (entry.entryType === "zone") {
            const clash = await this.repo.findOne({ where: { pathPrefix: entry.pathPrefix! } });
            if (clash && clash.key !== key) {
                throw new BadRequestException(`pathPrefix ${entry.pathPrefix} 已被 ${clash.key} 占用`);
            }
        }
        // apiPathPrefixes 是数组列,DB 唯一索引管不到元素级别,只能应用层全表扫描比对。
        // 表本身就是治理级别的小表(几十行封顶),扫描成本可忽略
        if (entry.apiPathPrefixes?.length) {
            const others = (await this.rows()).filter((r) => r.key !== key);
            for (const prefix of entry.apiPathPrefixes) {
                const clash = others.find((r) => r.apiPathPrefixes?.includes(prefix));
                if (clash) throw new BadRequestException(`apiPathPrefixes ${prefix} 已被 ${clash.key} 占用`);
            }
        }
        await this.assertGroupingValid(key, entry.parentKey);
        const existing = await this.repo.findOne({ where: { key } });
        const trustLevel = entry.trustLevel ?? existing?.trustLevel ?? DEFAULT_TRUST_LEVEL;
        const fields = {
            name: entry.name,
            baseUrl: entry.baseUrl,
            healthPath: entry.healthPath ?? null,
            metricsPath: entry.metricsPath ?? null,
            toolsPath: entry.toolsPath ?? null,
            enabled: entry.enabled !== false,
            entryType: entry.entryType ?? "none",
            embedUrl: entry.embedUrl ?? null,
            menuTitle: entry.menuTitle ?? null,
            menuIcon: entry.menuIcon ?? null,
            permCode: entry.permCode ?? null,
            // 非 zone 条目前缀强制置空,否则残留值会一直占着唯一索引
            pathPrefix: entry.entryType === "zone" ? entry.pathPrefix! : null,
            apiPathPrefixes: entry.apiPathPrefixes?.length ? entry.apiPathPrefixes : null,
            trustLevel,
            // 只有全新登记才落默认授权集。更新时不传 grants = 保持原样,
            // 否则改个 name 就会把管理员精心收窄过的授权悄悄重置回默认值
            grants: entry.grants ?? existing?.grants ?? defaultGrantsFor(trustLevel),
            parentKey: entry.parentKey ?? null,
        };
        if (existing) {
            await this.repo.save(Object.assign(existing, fields));
        } else {
            await this.repo.save(this.repo.create({ key, ...fields }));
        }
        // 审计走事件 outbox,发失败不影响登记本身
        await this.emitSafe(existing ? "service.updated" : "service.registered", key, entry, by);
    }

    async remove(key: string, by: string): Promise<void> {
        const existing = await this.repo.findOne({ where: { key } });
        if (!existing) throw new NotFoundException(`服务不存在: ${key}`);
        // 不做级联删除:那会在删一条父记录时静默带走几条子记录,误伤起来不可撤销。
        // 报出子节点的 key,让操作者自己决定是先解组还是先删子
        const children = await this.repo.find({ where: { parentKey: key } });
        if (children.length) {
            throw new BadRequestException(
                `该服务下还有子菜单(${children.map((c) => c.key).join(", ")}),请先移除它们的 parentKey 或先删除它们`,
            );
        }
        await this.repo.remove(existing);
        await this.emitSafe("service.removed", key, toEntry(existing), by);
    }

    /**
     * 父子关系校验。**只支持两层**,所以规则可以很简单:父必须是顶层记录。
     *
     * 这条规则同时把三种坏数据一起挡掉,不需要真去遍历链路找环:
     * - 自己指向自己
     * - A 的父是 B、B 的父是 A(因为 B 有 parentKey,就当不了父)
     * - 三层嵌套(同上)
     * 另外,自己已经有子节点时不能再认父——否则就成了三层
     */
    private async assertGroupingValid(key: string, parentKey: string | undefined): Promise<void> {
        if (!parentKey) return;
        if (!KEY_RE.test(parentKey)) throw new BadRequestException("parentKey 需为小写 slug(≤50字)");
        if (parentKey === key) throw new BadRequestException("parentKey 不能指向自己");

        const parent = await this.repo.findOne({ where: { key: parentKey } });
        if (!parent) throw new BadRequestException(`parentKey 指向的服务不存在: ${parentKey}`);
        if (parent.parentKey) {
            throw new BadRequestException(
                `${parentKey} 自己已归到 ${parent.parentKey} 之下,菜单只支持两层,不能再作为父节点`,
            );
        }

        const ownChildren = await this.repo.find({ where: { parentKey: key } });
        if (ownChildren.length) {
            throw new BadRequestException(
                `${key} 下已有子菜单(${ownChildren.map((c) => c.key).join(", ")}),它不能同时是别人的子节点`,
            );
        }
    }

    private validate(entry: ServiceEntry): void {
        if (!entry.name?.trim()) throw new BadRequestException("name 不能为空");
        this.assertUrl(entry.baseUrl, "baseUrl");
        if (entry.trustLevel !== undefined && !isServiceTrustLevel(entry.trustLevel)) {
            throw new BadRequestException("trustLevel 仅支持 first-party/second-party/third-party");
        }
        if (entry.grants !== undefined) {
            if (!Array.isArray(entry.grants)) throw new BadRequestException("grants 需为数组");
            // 白名单校验:拼错的 grant code 会静默变成"永远不匹配",
            // 表现为接口莫名 403,排查时很难想到是配置里少了个字母
            const unknown = entry.grants.filter((g) => !GRANT_CODES.includes(g as never));
            if (unknown.length) {
                throw new BadRequestException(`未知的 grant: ${unknown.join(", ")}`);
            }
        }
        if (entry.entryType && !["none", "embed", "zone"].includes(entry.entryType)) {
            throw new BadRequestException("entryType 仅支持 none/embed/zone");
        }
        if (entry.entryType === "embed") {
            if (!entry.embedUrl) throw new BadRequestException("entryType=embed 时 embedUrl 必填");
            this.assertUrl(entry.embedUrl, "embedUrl");
        }
        if (entry.entryType === "zone") {
            if (!entry.pathPrefix) throw new BadRequestException("entryType=zone 时 pathPrefix 必填");
            if (!PREFIX_RE.test(entry.pathPrefix)) {
                throw new BadRequestException("pathPrefix 需为单段小写路径,如 /activity");
            }
            if (RESERVED_PREFIXES.includes(entry.pathPrefix)) {
                throw new BadRequestException(`pathPrefix ${entry.pathPrefix} 为主站保留路径`);
            }
        }
        for (const f of ["healthPath", "metricsPath", "toolsPath"] as const) {
            const v = entry[f];
            if (v && !v.startsWith("/")) throw new BadRequestException(`${f} 需为 / 开头的相对路径`);
        }
        if (entry.apiPathPrefixes) {
            for (const prefix of entry.apiPathPrefixes) {
                if (!API_PREFIX_RE.test(prefix)) {
                    throw new BadRequestException(`apiPathPrefixes ${prefix} 需为小写分段路径,如 /biz/partner`);
                }
                if (API_RESERVED_PREFIXES.some((r) => prefix === r || prefix.startsWith(`${r}/`))) {
                    throw new BadRequestException(`apiPathPrefixes ${prefix} 为主服务保留路径`);
                }
            }
        }
        if (entry.permCode && !PERM_RE.test(entry.permCode)) {
            throw new BadRequestException("permCode 需为字母开头的字母数字(≤50字)");
        }
    }

    private assertUrl(raw: string | undefined, field: string): void {
        if (!raw) throw new BadRequestException(`${field} 不能为空`);
        let url: URL;
        try {
            url = new URL(raw);
        } catch {
            throw new BadRequestException(`${field} 不是合法 URL`);
        }
        // 只认 http(s):探测器会 fetch 它,file:/gopher: 之类是 SSRF 经典入口
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new BadRequestException(`${field} 仅允许 http/https`);
        }
        // 带用户信息段的 URL 没有正当用途,只会出现在钓鱼/绕过场景里
        if (url.username || url.password) {
            throw new BadRequestException(`${field} 不允许携带用户信息段`);
        }
    }

    private async rows(): Promise<ServiceRegistryEntity[]> {
        return this.repo.find({ order: { sortOrder: "ASC", id: "ASC" } });
    }

    private async emitSafe(type: string, key: string, entry: ServiceEntry, by: string): Promise<void> {
        try {
            await this.events.emit("optimus-api", type, { key, name: entry.name, baseUrl: entry.baseUrl }, by);
        } catch { /* 事件是旁路 */ }
    }
}

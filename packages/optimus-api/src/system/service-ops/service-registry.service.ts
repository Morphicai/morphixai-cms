import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DictionaryEntity, DictionaryStatus } from "../dictionary/entities/dictionary.entity";
import { ServiceEventService } from "./service-event.service";

export const REGISTRY_COLLECTION = "services-registry";

/** 目录条目——服务的自我声明。存储即 services-registry 集合行的 value */
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
}

const KEY_RE = /^[a-z][a-z0-9-]{0,49}$/;
const PERM_RE = /^[A-Za-z][A-Za-z0-9]{0,49}$/;
// 单段小写前缀:/activity 合法,/a/b 不合法——zone 边界是业务域,一段足矣,
// 多段前缀会让 assetPrefix 约定(prefix + "-static")和唯一性判断复杂化
const PREFIX_RE = /^\/[a-z][a-z0-9-]{0,49}$/;
// 主站自身占用的一级路径,zone 前缀撞上会把主站流量劫走(proxy 里 zone 匹配先于页面路由)
const RESERVED_PREFIXES = ["/api", "/auth", "/embed"];

/**
 * 服务目录:唯一事实源,探测/菜单/Agent 工具三个消费者读同一份数据。
 * 存储复用 services-registry 集合行(不建新表);校验在这里而不靠 form schema——
 * URL 协议、字段联动这类规则 form 协议表达不了,而且这个接入面必须自己站得住,
 * 不能依赖"数据恰好是从受校验的入口进来的"。
 */
@Injectable()
export class ServiceRegistryService {
    constructor(
        @InjectRepository(DictionaryEntity)
        private readonly dictRepo: Repository<DictionaryEntity>,
        private readonly events: ServiceEventService,
    ) {}

    /** 完整目录(治理视角,ServiceOps 门后使用) */
    async list(): Promise<Array<{ key: string; sortOrder: number } & ServiceEntry>> {
        const rows = await this.rows();
        return rows.map((r) => ({ key: r.key, sortOrder: r.sortOrder, ...(r.value as ServiceEntry) }));
    }

    /** embed 入口条目(登录即可读,前端据 permCode 过滤菜单;真正的门在子应用后端) */
    async listEmbedEntries(): Promise<Array<{ key: string } & Pick<ServiceEntry, "menuTitle" | "menuIcon" | "permCode" | "embedUrl">>> {
        const rows = await this.rows();
        return rows
            .map((r) => ({ key: r.key, ...(r.value as ServiceEntry) }))
            .filter((e) => e.enabled !== false && e.entryType === "embed" && e.embedUrl)
            .map(({ key, menuTitle, menuIcon, permCode, embedUrl, name }) => ({
                key,
                menuTitle: menuTitle || name,
                menuIcon,
                permCode,
                embedUrl,
            }));
    }

    /** 工具提供方(AgentConsole 门,最小披露:只给工具发现需要的三个字段) */
    async listToolProviders(): Promise<Array<{ key: string; baseUrl: string; toolsPath: string }>> {
        const rows = await this.rows();
        return rows
            .map((r) => ({ key: r.key, ...(r.value as ServiceEntry) }))
            .filter((e) => e.enabled !== false && e.toolsPath)
            .map(({ key, baseUrl, toolsPath }) => ({ key, baseUrl, toolsPath: toolsPath! }));
    }

    /** zone 路由表(主 zone 启动时拉取生成 rewrites;匿名接口消费,只出这三个字段) */
    async listZoneRoutes(): Promise<Array<{ key: string; pathPrefix: string; baseUrl: string }>> {
        const rows = await this.rows();
        return rows
            .map((r) => ({ key: r.key, ...(r.value as ServiceEntry) }))
            .filter((e) => e.enabled !== false && e.entryType === "zone" && e.pathPrefix)
            .map(({ key, pathPrefix, baseUrl }) => ({ key, pathPrefix: pathPrefix!, baseUrl }));
    }

    async upsert(key: string, entry: ServiceEntry, by: string): Promise<void> {
        if (!KEY_RE.test(key)) throw new BadRequestException("key 需为小写 slug(≤50字)");
        this.validate(entry);
        // zone 前缀全域唯一:两个 zone 抢同一段路径,rewrites 只会命中一个,另一个静默失效
        if (entry.entryType === "zone") {
            const rows = await this.rows();
            const clash = rows.find(
                (r) => r.key !== key && (r.value as ServiceEntry)?.pathPrefix === entry.pathPrefix,
            );
            if (clash) throw new BadRequestException(`pathPrefix ${entry.pathPrefix} 已被 ${clash.key} 占用`);
        }
        const existing = await this.dictRepo.findOne({ where: { collection: REGISTRY_COLLECTION, key } });
        if (existing) {
            existing.value = entry;
            await this.dictRepo.save(existing);
        } else {
            await this.dictRepo.save(
                this.dictRepo.create({ collection: REGISTRY_COLLECTION, key, value: entry }),
            );
        }
        // 审计走事件 outbox,发失败不影响登记本身
        await this.emitSafe(existing ? "service.updated" : "service.registered", key, entry, by);
    }

    async remove(key: string, by: string): Promise<void> {
        const existing = await this.dictRepo.findOne({ where: { collection: REGISTRY_COLLECTION, key } });
        if (!existing) throw new NotFoundException(`服务不存在: ${key}`);
        await this.dictRepo.remove(existing);
        await this.emitSafe("service.removed", key, existing.value as ServiceEntry, by);
    }

    private validate(entry: ServiceEntry): void {
        if (!entry.name?.trim()) throw new BadRequestException("name 不能为空");
        this.assertUrl(entry.baseUrl, "baseUrl");
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

    private async rows(): Promise<DictionaryEntity[]> {
        return this.dictRepo.find({
            where: { collection: REGISTRY_COLLECTION, status: DictionaryStatus.ACTIVE },
            order: { sortOrder: "ASC", id: "ASC" },
        });
    }

    private async emitSafe(type: string, key: string, entry: ServiceEntry, by: string): Promise<void> {
        try {
            await this.events.emit("optimus-api", type, { key, name: entry.name, baseUrl: entry.baseUrl }, by);
        } catch { /* 事件是旁路 */ }
    }
}

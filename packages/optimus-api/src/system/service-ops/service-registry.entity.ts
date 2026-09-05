import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ServiceTrustLevel } from "./service-trust.constants";

/**
 * 服务目录专表。曾经复用字典集合行,但字典是通用业务数据的地盘——
 * 持 DataCollections 权限的人在数据集合页一个删除就能把整个服务目录端掉,
 * zone 路由/动态菜单/agent 工具发现全部失联。基础设施数据必须物理隔离:
 * 这张表只有 ServiceOps 门后的接口能碰,字典侧的任何操作都够不着它。
 * 字段列化而非 JSON 包:pathPrefix 的唯一性下沉到 DB 兜底,应用层校验挂了也撞不进来。
 */
@Entity("op_sys_service_registry")
export class ServiceRegistryEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({ length: 50 })
    key: string;

    @Column({ length: 100 })
    name: string;

    @Column({ name: "base_url", length: 500 })
    baseUrl: string;

    @Column({ name: "health_path", length: 200, nullable: true })
    healthPath: string | null;

    @Column({ name: "metrics_path", length: 200, nullable: true })
    metricsPath: string | null;

    @Column({ name: "tools_path", length: 200, nullable: true })
    toolsPath: string | null;

    @Column({ default: true })
    enabled: boolean;

    /** none=无入口;embed=iframe 嵌入管理基座;zone=C 端路径分区 */
    @Column({ name: "entry_type", length: 10, default: "none" })
    entryType: "none" | "embed" | "zone";

    @Column({ name: "embed_url", length: 500, nullable: true })
    embedUrl: string | null;

    @Column({ name: "menu_title", length: 100, nullable: true })
    menuTitle: string | null;

    @Column({ name: "menu_icon", length: 50, nullable: true })
    menuIcon: string | null;

    @Column({ name: "perm_code", length: 50, nullable: true })
    permCode: string | null;

    /** zone 专用 URL 前缀(页面路由)。DB 唯一索引兜底(MySQL 下多个 NULL 不冲突,非 zone 条目留空) */
    @Index({ unique: true })
    @Column({ name: "path_prefix", length: 50, nullable: true })
    pathPrefix: string | null;

    /**
     * API 请求路由前缀(与 pathPrefix 是两个独立概念:pathPrefix 管页面级 zone 路由,
     * 这个管 API 级请求路由——一个服务可以两者都有、都没有,或只有其中一个)。
     * 数组存 JSON 列,唯一性(跨服务不重叠)在应用层校验,DB 不便对数组元素做唯一约束
     */
    @Column({ name: "api_path_prefixes", type: "json", nullable: true })
    apiPathPrefixes: string[] | null;

    /**
     * 代码提供方的可信程度,**不是业务重要性**——一方服务可以处理核心支付,
     * 三方服务可以只做活动页。它只决定新登记时的默认 grants,以及与级别绑定的
     * 硬约束(third-party 不得与平台共用数据库实例)。运行时授权判据始终是 grants。
     */
    @Column({ name: "trust_level", length: 20, default: "first-party" })
    trustLevel: ServiceTrustLevel;

    /**
     * 该服务被授予的平台能力,形如 `["user-profile:read-basic", "points:grant"]`。
     * 这是**服务的**权限码,与用户权限码(perm_code + CASL)平行但体系独立:
     * 服务的授权不能通过转发一个高权限用户的 token 获得。
     */
    @Column({ name: "grants", type: "json", nullable: true })
    grants: string[] | null;

    /**
     * 归组到哪条记录之下(指向另一行的 key)。空 = 顶层。
     *
     * 自引用而不是建"分组表":这里的关系是"多条记录归同一个父",一个可空字段就够了,
     * 建表反而要多维护一份主键与一层 join。
     *
     * **只支持两层**(父 → 子,子不能再有子)——父必须是顶层记录,写入时校验。
     * 层数放开会让侧边栏和权限过滤的组合情况迅速变多,而现在没有这个需求。
     */
    @Column({ name: "parent_key", length: 50, nullable: true })
    parentKey: string | null;

    @Column({ name: "sort_order", default: 0 })
    sortOrder: number;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}

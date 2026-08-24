import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

    /** zone 专用 URL 前缀。DB 唯一索引兜底(MySQL 下多个 NULL 不冲突,非 zone 条目留空) */
    @Index({ unique: true })
    @Column({ name: "path_prefix", length: 50, nullable: true })
    pathPrefix: string | null;

    @Column({ name: "sort_order", default: 0 })
    sortOrder: number;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}

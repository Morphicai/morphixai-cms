import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ValueTransformer,
} from "typeorm";

/**
 * 短链状态
 */
export enum ShortLinkStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
}

/**
 * 短链来源
 */
export enum ShortLinkSource {
    ADMIN = "admin", // 后台管理创建（支持多平台配置的完整短链）
    SYSTEM = "system", // 系统服务创建（用于存储参数字符串）
    API = "api", // API接口创建
}

/**
 * Target 字段转换器
 * 处理多种数据格式，兼容旧数据：
 * 1. 带引号的字符串: "inviterCode=LP946971&channelCode=P9GHGF" (旧数据)
 * 2. 普通字符串: inviterCode=LP946971&channelCode=P9GHGF
 * 3. JSON 字符串: '{"ios": "...", "android": "...", "default": "..."}'
 * 4. JSON 对象: {"ios": "...", "android": "...", "default": "..."}（旧数据兼容）
 */
const targetTransformer: ValueTransformer = {
    // 存储到数据库
    to: (value: any): string => {
        if (value === null || value === undefined) {
            return "";
        }

        // 如果是对象，序列化为 JSON 字符串
        if (typeof value === "object") {
            return JSON.stringify(value);
        }

        // 如果是字符串，直接返回
        if (typeof value === "string") {
            return value;
        }

        // 其他类型，转为字符串
        return String(value);
    },
    // 从数据库读取
    from: (value: any): any => {
        if (value === null || value === undefined || value === "") {
            return null;
        }

        // 如果已经是对象（旧数据，MySQL JSON 类型自动解析的），直接返回
        if (typeof value === "object" && value !== null) {
            return value;
        }

        // 如果是字符串，尝试解析为 JSON
        if (typeof value === "string") {
            // 去除首尾空格
            let trimmed = value.trim();

            // 处理带引号的字符串（旧数据格式）
            // 例如: "inviterCode=LP580548&channelCode=S9JGX5"
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                // 去掉首尾引号
                trimmed = trimmed.slice(1, -1);
                // 如果去掉引号后不是 JSON 格式，直接返回
                if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
                    return trimmed;
                }
            }

            // 判断是否是 JSON 格式（以 { 或 [ 开头）
            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                try {
                    return JSON.parse(trimmed);
                } catch {
                    // JSON 解析失败，返回原字符串（去掉引号后的）
                    return trimmed;
                }
            }

            // 普通字符串，直接返回
            return trimmed;
        }

        // 其他情况，直接返回
        return value;
    },
};

/**
 * 短链实体
 */
@Entity("short_link")
// 注意：token 列已使用 unique: true，无需在类级别再次定义唯一索引
@Index(["status"])
@Index(["source"])
@Index(["createdBy"])
@Index(["disabled"])
export class ShortLinkEntity {
    @PrimaryGeneratedColumn({ comment: "主键ID" })
    id: number;

    @Column({ length: 6, unique: true, comment: "6位短链token" })
    token: string;

    @Column({ type: "text", comment: "目标内容（支持字符串或JSON格式）", transformer: targetTransformer })
    target: any;

    @Column({ type: "enum", enum: ShortLinkStatus, default: ShortLinkStatus.ACTIVE, comment: "状态" })
    status: ShortLinkStatus;

    @Column({ type: "enum", enum: ShortLinkSource, default: ShortLinkSource.ADMIN, comment: "来源" })
    source: ShortLinkSource;

    @Column({ type: "boolean", default: false, comment: "是否禁用" })
    disabled: boolean;

    @Column({ name: "use_count", type: "int", default: 0, comment: "使用次数" })
    useCount: number;

    @Column({ name: "last_used_at", type: "timestamp", nullable: true, comment: "最后使用时间" })
    lastUsedAt: Date;

    @Column({ type: "json", nullable: true, comment: "扩展字段（JSON格式）" })
    extra: any;

    @Column({ name: "created_by", nullable: true, comment: "创建人ID" })
    createdBy: number;

    @Column({ length: 500, nullable: true, comment: "备注说明" })
    remark: string;

    @CreateDateColumn({ name: "created_at", comment: "创建时间" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at", comment: "更新时间" })
    updatedAt: Date;
}

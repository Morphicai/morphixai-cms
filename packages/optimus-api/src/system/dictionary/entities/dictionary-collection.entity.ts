import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

/**
 * 数据类型枚举
 */
export enum DataType {
    OBJECT = "object",
    ARRAY = "array",
    STRING = "string",
    NUMBER = "number",
    BOOLEAN = "boolean",
    IMAGE = "image",
    FILE = "file",
}

/**
 * 访问类型枚举
 */
export enum AccessType {
    PRIVATE = "private", // 后台私有
    PUBLIC_READ = "public_read", // C端公开读
    PUBLIC_WRITE = "public_write", // C端公开读写
    USER_PRIVATE = "user_private", // 用户私有数据
}

/**
 * 集合状态
 */
export enum CollectionStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
}

/**
 * 字典集合配置实体
 */
@Entity("dictionary_collection")
@Index(["name"])
@Index(["accessType"])
@Index(["status"])
export class DictionaryCollectionEntity {
    @PrimaryGeneratedColumn({ comment: "主键ID" })
    id: number;

    @Column({ length: 50, unique: true, comment: "集合名称（唯一标识）" })
    name: string;

    @Column({ name: "display_name", length: 100, comment: "显示名称" })
    displayName: string;

    @Column({ length: 500, nullable: true, comment: "集合描述" })
    description: string;

    @Column({ name: "data_type", type: "enum", enum: DataType, default: DataType.OBJECT, comment: "数据类型" })
    dataType: DataType;

    @Column({ type: "json", nullable: true, comment: "数据结构定义（JSON Schema）" })
    schema: any;

    @Column({ name: "access_type", type: "enum", enum: AccessType, default: AccessType.PRIVATE, comment: "访问类型" })
    accessType: AccessType;

    @Column({ name: "max_items", default: 1000, comment: "最大条目数" })
    maxItems: number;

    @Column({ name: "max_items_per_user", default: 100, comment: "每个用户最大条目数" })
    maxItemsPerUser: number;

    @Column({ type: "enum", enum: CollectionStatus, default: CollectionStatus.ACTIVE, comment: "状态" })
    status: CollectionStatus;

    @CreateDateColumn({ name: "created_at", comment: "创建时间" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at", comment: "更新时间" })
    updatedAt: Date;
}

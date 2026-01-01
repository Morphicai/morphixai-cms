import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

/**
 * 字典状态
 */
export enum DictionaryStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
}

/**
 * 字典实体
 */
@Entity("dictionary")
@Index(["collection"])
@Index(["status"])
@Index(["sortOrder"])
export class DictionaryEntity {
    @PrimaryGeneratedColumn({ comment: "主键ID" })
    id: number;

    @Column({ length: 50, comment: "集合名称" })
    collection: string;

    @Column({ length: 100, comment: "字典键" })
    key: string;

    @Column({ name: "user_id", nullable: true, comment: "用户ID（仅user_private类型集合使用）" })
    userId: number;

    @Column({ type: "json", comment: "字典值（JSON格式）" })
    value: any;

    @Column({ name: "sort_order", default: 0, comment: "排序顺序" })
    sortOrder: number;

    @Column({ type: "enum", enum: DictionaryStatus, default: DictionaryStatus.ACTIVE, comment: "状态" })
    status: DictionaryStatus;

    @Column({ length: 500, nullable: true, comment: "备注说明" })
    remark: string;

    @CreateDateColumn({ name: "created_at", comment: "创建时间" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at", comment: "更新时间" })
    updatedAt: Date;
}

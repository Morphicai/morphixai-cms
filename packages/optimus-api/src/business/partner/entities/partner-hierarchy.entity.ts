import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("op_biz_partner_hierarchy")
@Index(["parentPartnerId", "level"])
@Index(["childPartnerId", "level", "isActive"]) // 复合索引已包含 childPartnerId，无需单独创建索引
export class PartnerHierarchyEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string;

    @Column({ type: "bigint", name: "parent_partner_id" })
    parentPartnerId: string;

    @Column({ type: "bigint", name: "child_partner_id" })
    childPartnerId: string;

    @Column({ type: "tinyint" })
    level: number;

    @Column({ type: "bigint", nullable: true, name: "source_channel_id" })
    sourceChannelId: string | null;

    @CreateDateColumn({ type: "timestamp", name: "bind_time" })
    bindTime: Date;

    @Column({ type: "boolean", default: true, name: "is_active" })
    isActive: boolean;
}

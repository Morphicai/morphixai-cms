import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { ClientUserEntity } from "./client-user.entity";

/**
 * 外部账号绑定实体
 * 用于绑定第三方平台账号（可选功能）
 */
@Entity("client_user_external_account")
@Index(["userId", "platform"], { unique: true })
@Index(["platform", "externalUserId"], { unique: true })
export class ClientUserExternalAccountEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string;

    @Column({ type: "bigint", name: "user_id" })
    // 注意：userId 和 platform 已在类级别的复合索引中定义，无需单独创建索引
    userId: string;

    @Column({ type: "varchar", length: 50 })
    // 注意：platform 已在类级别的复合索引中定义，无需单独创建索引
    platform: string;

    @Column({ type: "varchar", length: 255, name: "external_user_id" })
    externalUserId: string;

    @Column({ type: "varchar", length: 100, nullable: true, name: "external_username" })
    externalUsername: string | null;

    @Column({ type: "varchar", length: 100, nullable: true, name: "external_email" })
    externalEmail: string | null;

    @Column({ type: "varchar", length: 500, nullable: true, name: "external_avatar" })
    externalAvatar: string | null;

    @CreateDateColumn({ type: "timestamp", name: "bind_time" })
    bindTime: Date;

    @Column({ type: "timestamp", nullable: true, name: "last_sync_time" })
    lastSyncTime: Date | null;

    @Column({ type: "boolean", default: false, name: "is_primary" })
    isPrimary: boolean;

    @Column({ type: "json", nullable: true, name: "extra_data" })
    extraData: Record<string, any> | null;

    @ManyToOne(() => ClientUserEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: ClientUserEntity;
}

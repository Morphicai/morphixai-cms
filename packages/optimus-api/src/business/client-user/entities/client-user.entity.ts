import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { UserStatus } from "../enums/user-status.enum";

/**
 * 客户端用户实体
 * 核心用户表，所有业务模块使用此表的 user_id
 */
@Entity("client_user")
export class ClientUserEntity {
    @PrimaryGeneratedColumn({ type: "bigint", name: "user_id" })
    userId: string;

    // 注意：unique: true 会自动创建唯一索引，无需额外的 @Index()
    @Column({ type: "varchar", length: 50, unique: true, nullable: true })
    username: string | null;

    // 注意：unique: true 会自动创建唯一索引，无需额外的 @Index()
    @Column({ type: "varchar", length: 100, unique: true, nullable: true })
    email: string | null;

    // 注意：unique: true 会自动创建唯一索引，无需额外的 @Index()
    @Column({ type: "varchar", length: 20, unique: true, nullable: true })
    phone: string | null;

    @Column({ type: "varchar", length: 255, nullable: true, name: "password_hash" })
    passwordHash: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    nickname: string | null;

    @Column({ type: "varchar", length: 500, nullable: true })
    avatar: string | null;

    @Column({
        type: "enum",
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    })
    @Index()
    status: UserStatus;

    @Column({ type: "varchar", length: 50, default: "direct", name: "register_source" })
    registerSource: string;

    @Column({ type: "varchar", length: 45, nullable: true, name: "register_ip" })
    registerIp: string | null;

    @Column({ type: "timestamp", nullable: true, name: "last_login_at" })
    lastLoginAt: Date | null;

    @Column({ type: "varchar", length: 45, nullable: true, name: "last_login_ip" })
    lastLoginIp: string | null;

    @CreateDateColumn({ type: "timestamp", name: "created_at" })
    @Index()
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
    updatedAt: Date;

    @Column({ type: "json", nullable: true, name: "extra_data" })
    extraData: Record<string, any> | null;
}

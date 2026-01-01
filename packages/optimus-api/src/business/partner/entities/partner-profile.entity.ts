import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { PartnerStatus } from "../enums/partner-status.enum";
import { StarLevel } from "../enums/star-level.enum";
import { UserSource } from "../../../shared/interfaces/user-identity.interface";

@Entity("biz_partner_profile")
export class PartnerProfileEntity {
    @PrimaryGeneratedColumn({ type: "bigint", name: "partner_id" })
    partnerId: string;

    // 新字段：通用用户标识
    @Column({ type: "varchar", length: 255, name: "user_id" })
    @Index()
    userId: string;

    @Column({
        type: "varchar",
        length: 50,
        default: UserSource.WEMADE,
        name: "user_source",
    })
    @Index()
    userSource: UserSource;

    // 旧字段：保留用于向后兼容
    @Column({ type: "varchar", length: 100, nullable: true })
    @Index()
    uid: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    @Index()
    username: string;

    @Column({ type: "varchar", length: 32, unique: true, name: "partner_code" })
    @Index()
    partnerCode: string;

    @Column({
        type: "enum",
        enum: PartnerStatus,
        default: PartnerStatus.ACTIVE,
    })
    status: PartnerStatus;

    @Column({
        type: "varchar",
        length: 16,
        default: StarLevel.NEW,
        name: "current_star",
    })
    currentStar: StarLevel;

    @Column({ type: "bigint", default: 0, name: "total_mira" })
    totalMira: string;

    @CreateDateColumn({ type: "timestamp", name: "join_time" })
    joinTime: Date;

    @UpdateDateColumn({ type: "timestamp", name: "last_update_time" })
    lastUpdateTime: Date;

    @Column({ type: "varchar", length: 255, nullable: true })
    remark: string;

    @Column({ type: "json", nullable: true, name: "extra_data" })
    extraData: Record<string, any>;

    @Column({ type: "varchar", length: 100, nullable: true, name: "team_name" })
    teamName: string;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { ChannelStatus } from "../enums/channel-status.enum";

@Entity("op_biz_partner_channel")
@Index(["partnerId", "channelCode"], { unique: true })
export class PartnerChannelEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string;

    @Column({ type: "bigint", name: "partner_id" })
    partnerId: string;

    @Column({ type: "varchar", length: 32, name: "channel_code" })
    channelCode: string;

    @Column({ type: "varchar", length: 64 })
    name: string;

    @Column({ type: "varchar", length: 255, nullable: true, name: "short_url" })
    shortUrl: string | null;

    @Column({
        type: "enum",
        enum: ChannelStatus,
        default: ChannelStatus.ACTIVE,
    })
    status: ChannelStatus;

    @CreateDateColumn({ type: "timestamp", name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
    updatedAt: Date;
}

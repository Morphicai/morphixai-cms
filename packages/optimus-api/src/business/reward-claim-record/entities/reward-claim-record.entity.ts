import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { RewardClaimStatus } from "../enums/reward-claim-status.enum";

/**
 * 奖励发放记录实体
 * 注意：允许同一用户多次领取同一活动的奖励（根据活动的 maxClaimTimes 限制）
 */
@Entity("biz_reward_claim_record")
@Index(["uid"])
@Index(["activityCode"])
@Index(["uid", "activityCode"])
export class RewardClaimRecordEntity {
    @ApiProperty({ description: "记录ID" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @ApiProperty({ description: "用户ID" })
    @Column({ type: "varchar", length: 100, comment: "用户ID" })
    public uid: string;

    @ApiProperty({ description: "活动代码" })
    @Column({ type: "varchar", length: 100, name: "activity_code", comment: "活动代码，关联到活动中心" })
    public activityCode: string;

    @ApiProperty({ description: "角色ID" })
    @Column({ type: "varchar", length: 100, name: "role_id", comment: "角色ID" })
    public roleId: string;

    @ApiProperty({ description: "服务器ID" })
    @Column({ type: "varchar", length: 100, name: "server_id", comment: "服务器ID" })
    public serverId: string;

    @ApiProperty({ description: "领取状态", enum: RewardClaimStatus })
    @Column({
        type: "enum",
        enum: RewardClaimStatus,
        default: RewardClaimStatus.CLAIMING,
        comment: "领取状态：CLAIMING(领取中)、CLAIMED(已发放)、FAILED(领取失败)",
    })
    public status: RewardClaimStatus;

    @ApiProperty({ description: "开始领取时间" })
    @Column({ type: "datetime", name: "claim_start_time", comment: "开始领取时间" })
    public claimStartTime: Date;

    @ApiProperty({ description: "成功时间", required: false })
    @Column({ type: "datetime", name: "claim_success_time", nullable: true, comment: "成功时间" })
    public claimSuccessTime?: Date;

    @ApiProperty({ description: "失败时间", required: false })
    @Column({ type: "datetime", name: "claim_fail_time", nullable: true, comment: "失败时间" })
    public claimFailTime?: Date;

    @ApiProperty({ description: "失败原因", required: false })
    @Column({ type: "varchar", length: 500, nullable: true, name: "fail_reason", comment: "失败原因" })
    public failReason?: string;

    @ApiProperty({ description: "奖励信息数组" })
    @Column({
        type: "json",
        nullable: false,
        comment: "奖励信息数组，格式：[{ id: string, name: string, quantity: number }]",
    })
    public rewards: Array<{ id: string; name: string; quantity: number }>;

    @ApiProperty({ description: "创建时间" })
    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "创建时间" })
    public createDate: Date;

    @ApiProperty({ description: "更新时间" })
    @UpdateDateColumn({ type: "timestamp", name: "update_date", comment: "更新时间" })
    public updateDate: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { ActivityType } from "../../reward-claim-record/enums/activity-type.enum";

/**
 * 活动中心实体
 */
@Entity("op_biz_activity")
@Index(["activityCode"], { unique: true })
@Index(["type"])
@Index(["isDeleted"])
export class ActivityEntity {
    @ApiProperty({ description: "活动ID" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @ApiProperty({ description: "活动唯一代码" })
    @Column({ type: "varchar", length: 100, unique: true, name: "activity_code", comment: "活动唯一代码，用于识别唯一活动" })
    public activityCode: string;

    @ApiProperty({ description: "活动名称" })
    @Column({ type: "varchar", length: 200, comment: "活动名称" })
    public name: string;

    @ApiProperty({ description: "活动开始时间" })
    @Column({ type: "timestamp", name: "start_time", comment: "活动开始时间" })
    public startTime: Date;

    @ApiProperty({ description: "活动结束时间" })
    @Column({ type: "timestamp", name: "end_time", comment: "活动结束时间" })
    public endTime: Date;

    @ApiProperty({ description: "活动规则", required: false })
    @Column({ type: "text", nullable: true, comment: "活动规则（暂时不用，预留字段）" })
    public rules: string | null;

    @ApiProperty({ description: "活动类型", enum: ActivityType })
    @Column({
        type: "enum",
        enum: ActivityType,
        comment: "活动类型，用于识别走哪一类的活动",
    })
    public type: ActivityType;

    @ApiProperty({ description: "是否已删除" })
    @Column({ type: "boolean", default: false, name: "is_deleted", comment: "是否已删除（软删除标记）" })
    public isDeleted: boolean;

    @ApiProperty({ description: "删除时间", required: false })
    @Column({ type: "timestamp", nullable: true, name: "deleted_at", comment: "删除时间" })
    public deletedAt: Date | null;

    @ApiProperty({ description: "创建时间" })
    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "创建时间" })
    public createDate: Date;

    @ApiProperty({ description: "更新时间" })
    @UpdateDateColumn({ type: "timestamp", name: "update_date", comment: "更新时间" })
    public updateDate: Date;
}


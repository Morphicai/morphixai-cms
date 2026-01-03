import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

/**
 * 订单状态枚举
 */
export enum OrderStatus {
    /** 待支付 */
    PENDING = "pending",
    /** 已支付 */
    PAID = "paid",
    /** 已确认收货 */
    CONFIRMED = "confirmed",
}

/**
 * 订单实体
 */
@Entity("op_biz_order")
@Index(["uid"])
@Index(["status"])
export class OrderEntity {
    @ApiProperty({ description: "订单ID" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @ApiProperty({ description: "订单号（唯一）" })
    @Column({ type: "varchar", length: 100, unique: true, comment: "订单号" })
    public orderNo: string;

    @ApiProperty({ description: "GameWemade 用户ID" })
    @Column({ type: "varchar", length: 100, comment: "GameWemade 用户ID" })
    public uid: string;

    @ApiProperty({ description: "产品ID" })
    @Column({ type: "varchar", length: 50, comment: "产品ID" })
    public productId: string;

    @ApiProperty({ description: "订单金额" })
    @Column({ type: "decimal", precision: 10, scale: 2, comment: "订单金额" })
    public amount: number;

    @ApiProperty({ description: "订单状态", enum: OrderStatus })
    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
        comment: "订单状态: pending-待支付, paid-已支付, confirmed-已确认收货",
    })
    public status: OrderStatus;

    @ApiProperty({ description: "游戏订单号", required: false })
    @Column({ type: "varchar", length: 100, nullable: true, comment: "游戏订单号" })
    public cpOrderNo?: string;

    @ApiProperty({ description: "支付渠道订单号", required: false })
    @Column({ type: "varchar", length: 100, nullable: true, comment: "支付渠道订单号" })
    public channelOrderNo?: string;

    @ApiProperty({ description: "支付方式ID", required: false })
    @Column({ type: "int", nullable: true, comment: "支付方式ID" })
    public payType?: number;

    @ApiProperty({ description: "支付时间", required: false })
    @Column({ type: "timestamp", nullable: true, comment: "支付时间" })
    public payTime?: Date;

    @ApiProperty({ description: "确认收货时间", required: false })
    @Column({ type: "timestamp", nullable: true, comment: "确认收货时间" })
    public confirmTime?: Date;

    @ApiProperty({ description: "角色名", required: false })
    @Column({ type: "varchar", length: 100, nullable: true, comment: "角色名" })
    public roleName?: string;

    @ApiProperty({ description: "区服名", required: false })
    @Column({ type: "varchar", length: 100, nullable: true, comment: "区服名" })
    public serverName?: string;

    @ApiProperty({ description: "扩展参数（JSON格式）", required: false })
    @Column({ type: "json", nullable: true, comment: "扩展参数" })
    public extrasParams?: Record<string, any>;

    @ApiProperty({ description: "创建时间" })
    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "创建时间" })
    public createDate: Date;

    @ApiProperty({ description: "更新时间" })
    @UpdateDateColumn({ type: "timestamp", name: "update_date", comment: "更新时间" })
    public updateDate: Date;
}

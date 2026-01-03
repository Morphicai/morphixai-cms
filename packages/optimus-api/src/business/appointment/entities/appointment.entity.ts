import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

/**
 * 预约记录实体
 */
@Entity("op_biz_appointment")
export class AppointmentEntity {
    @ApiProperty({ description: "预约记录ID" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @ApiProperty({ description: "手机号" })
    @Column({ type: "varchar", length: 20, comment: "手机号" })
    public phone: string;

    @ApiProperty({ description: "用户UID", required: false })
    @Column({ type: "varchar", length: 100, nullable: true, comment: "用户UID" })
    public uid?: string;

    @ApiProperty({ description: "阶段" })
    @Column({ type: "varchar", length: 100, comment: "阶段" })
    public stage: string;

    @ApiProperty({ description: "渠道" })
    @Column({ type: "varchar", length: 100, comment: "渠道" })
    public channel: string;

    @ApiProperty({ description: "预约时间" })
    @Column({ type: "timestamp", name: "appointment_time", comment: "预约时间" })
    public appointmentTime: Date;

    @ApiProperty({ description: "额外字段1", required: false })
    @Column({ type: "varchar", length: 500, nullable: true, name: "extra_field_1", comment: "额外字段1" })
    public extraField1?: string;

    @ApiProperty({ description: "创建时间" })
    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "创建时间" })
    public createDate: Date;

    @ApiProperty({ description: "更新时间" })
    @UpdateDateColumn({ type: "timestamp", name: "update_date", comment: "更新时间" })
    public updateDate: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

/**
 * 系统操作日志实体
 * 用于记录所有管理员操作的审计日志
 */
@Entity("sys_operation_log")
@Index(["module", "action"])
@Index(["userId"])
@Index(["createDate"])
export class OperationLogEntity {
    @ApiProperty({ description: "日志ID" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @ApiProperty({ description: "模块名称" })
    @Column({ type: "varchar", length: 50, comment: "模块名称，如：user, role, menu" })
    public module: string;

    @ApiProperty({ description: "操作类型" })
    @Column({ type: "varchar", length: 50, comment: "操作类型，如：create, update, delete" })
    public action: string;

    @ApiProperty({ description: "操作描述" })
    @Column({ type: "varchar", length: 255, comment: "操作描述" })
    public description: string;

    @ApiProperty({ description: "操作用户ID" })
    @Column({ type: "varchar", length: 50, nullable: true, name: "user_id", comment: "操作用户ID" })
    public userId?: string;

    @ApiProperty({ description: "操作前数据" })
    @Column({ type: "json", nullable: true, name: "before_data", comment: "操作前数据" })
    public beforeData: Record<string, any>;

    @ApiProperty({ description: "操作后数据" })
    @Column({ type: "json", nullable: true, name: "after_data", comment: "操作后数据" })
    public afterData: Record<string, any>;

    @ApiProperty({ description: "操作状态" })
    @Column({ type: "varchar", length: 20, default: "success", comment: "操作状态: success, failed" })
    public status: string;

    @ApiProperty({ description: "错误信息" })
    @Column({ type: "text", nullable: true, name: "error_message", comment: "错误信息" })
    public errorMessage: string;

    @ApiProperty({ description: "操作耗时(ms)" })
    @Column({ type: "int", nullable: true, comment: "操作耗时(毫秒)" })
    public duration: number;

    @ApiProperty({ description: "IP地址" })
    @Column({ type: "varchar", length: 50, nullable: true, comment: "操作者IP地址" })
    public ip: string;

    @ApiProperty({ description: "用户代理" })
    @Column({ type: "varchar", length: 500, nullable: true, name: "user_agent", comment: "用户代理信息" })
    public userAgent: string;

    @ApiProperty({ description: "请求方法" })
    @Column({ type: "varchar", length: 10, nullable: true, comment: "HTTP请求方法" })
    public method: string;

    @ApiProperty({ description: "请求路径" })
    @Column({ type: "varchar", length: 255, nullable: true, comment: "请求路径" })
    public path: string;

    @ApiProperty({ description: "操作时间" })
    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "操作时间" })
    createDate: Date;
}

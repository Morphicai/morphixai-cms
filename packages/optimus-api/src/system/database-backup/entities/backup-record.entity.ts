import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

/**
 * 数据库备份记录实体
 */
@Entity("sys_database_backup")
export class BackupRecordEntity {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * 文件名
     */
    @Column({ type: "varchar", length: 255, comment: "备份文件名" })
    fileName: string;

    /**
     * 文件键名（OSS 中的完整路径）
     */
    @Column({ type: "varchar", length: 500, comment: "文件键名（OSS路径）" })
    fileKey: string;

    /**
     * 文件大小（字节）
     */
    @Column({ type: "bigint", comment: "文件大小（字节）" })
    fileSize: number;

    /**
     * 备份类型：auto-自动备份，manual-手动备份
     */
    @Column({ type: "varchar", length: 20, comment: "备份类型：auto/manual" })
    backupType: string;

    /**
     * 存储提供商：minio/aliyun
     */
    @Column({ type: "varchar", length: 50, comment: "存储提供商" })
    storageProvider: string;

    /**
     * 备份状态：pending-进行中，completed-完成，failed-失败
     */
    @Column({ type: "varchar", length: 20, default: "pending", comment: "备份状态" })
    status: string;

    /**
     * 备份开始时间
     */
    @Column({ type: "datetime", comment: "备份开始时间" })
    startTime: Date;

    /**
     * 备份完成时间
     */
    @Column({ type: "datetime", nullable: true, comment: "备份完成时间" })
    completedTime: Date;

    /**
     * 备份耗时（毫秒）
     */
    @Column({ type: "int", nullable: true, comment: "备份耗时（毫秒）" })
    duration: number;

    /**
     * 错误信息（如果失败）
     */
    @Column({ type: "text", nullable: true, comment: "错误信息" })
    errorMessage: string;

    /**
     * 备份描述/备注
     */
    @Column({ type: "varchar", length: 500, nullable: true, comment: "备份描述" })
    description: string;

    /**
     * 创建人ID
     */
    @Column({ type: "int", nullable: true, comment: "创建人ID" })
    createdBy: number;

    /**
     * 创建时间
     */
    @CreateDateColumn({ type: "datetime", comment: "创建时间" })
    createDate: Date;

    /**
     * 更新时间
     */
    @UpdateDateColumn({ type: "datetime", comment: "更新时间" })
    updateDate: Date;

    /**
     * 是否已删除
     */
    @Column({ type: "tinyint", default: 0, comment: "是否已删除：0-否，1-是" })
    isDeleted: number;

    /**
     * 删除时间
     */
    @Column({ type: "datetime", nullable: true, comment: "删除时间" })
    deletedAt: Date;
}

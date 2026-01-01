/**
 * 备份文件信息接口
 * 从 OSS 文件元数据中获取备份文件信息
 */
export interface BackupFileInfo {
    /** 文件名，格式：backup-{type}-YYYYMMDD-HHmmss.sql.gz.enc */
    fileName: string;

    /** OSS 文件键名（完整路径） */
    fileKey: string;

    /** 文件大小（字节） */
    fileSize: number;

    /** 创建时间（从文件名或 OSS 元数据解析） */
    createdAt: Date;

    /** 备份类型（从文件名解析） */
    backupType: "auto" | "manual";

    /** 存储提供商 */
    storageProvider: string;
}

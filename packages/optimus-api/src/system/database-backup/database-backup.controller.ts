import { Controller, Get, Post, Query, Res, UseGuards, Logger, HttpStatus, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { DatabaseBackupService } from "./database-backup.service";
import { FindBackupsDto } from "./dto/find-backups.dto";
import { JwtAuthGuard } from "../../shared/guards/auth.guard";
import { RolesGuard } from "../../shared/guards/roles.guard";
import { ResultData } from "../../shared/utils/result";
import { AllowNoPerm } from "../../shared/decorators/perm.decorator";
import { OperationLog } from "../../shared/decorators/operation-log.decorator";
import { OperationLogInterceptor } from "../../shared/interceptors/operation-log.interceptor";

/**
 * 数据库备份控制器
 * 提供备份管理相关的 API 接口
 * 权限：仅超级管理员可访问（通过 RolesGuard 自动检查）
 */
@ApiTags("数据库备份管理")
@ApiBearerAuth()
@Controller("backups")
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(OperationLogInterceptor)
export class DatabaseBackupController {
    private readonly logger = new Logger(DatabaseBackupController.name);

    constructor(private readonly backupService: DatabaseBackupService) {}

    /**
     * 手动触发备份
     * POST /backups/trigger
     * 权限：仅超级管理员
     */
    @Post("trigger")
    @ApiOperation({ summary: "手动触发数据库备份" })
    @ApiResponse({ status: 200, description: "备份任务已触发" })
    @ApiResponse({ status: 403, description: "权限不足" })
    @ApiResponse({ status: 500, description: "备份失败" })
    @AllowNoPerm()
    @OperationLog({
        module: "backup",
        action: "trigger",
        description: "手动触发数据库备份",
    })
    async triggerBackup(): Promise<ResultData> {
        try {
            this.logger.log("Manual backup triggered");

            // 异步执行备份
            const backupInfo = await this.backupService.executeBackup("manual");

            this.logger.log(`Manual backup completed: ${backupInfo.fileName}`);

            return ResultData.ok(
                {
                    fileName: backupInfo.fileName,
                    fileKey: backupInfo.fileKey,
                    fileSize: backupInfo.fileSize,
                    createdAt: backupInfo.createdAt,
                    backupType: backupInfo.backupType,
                },
                "备份任务执行成功",
            );
        } catch (error) {
            this.logger.error(`Manual backup failed: ${error.message}`, error.stack);
            return ResultData.fail(HttpStatus.INTERNAL_SERVER_ERROR, `备份失败: ${error.message}`);
        }
    }

    /**
     * 列出所有备份文件
     * GET /backups
     * 权限：仅超级管理员
     */
    @Get()
    @ApiOperation({ summary: "获取备份文件列表" })
    @ApiResponse({ status: 200, description: "获取备份列表成功" })
    @ApiResponse({ status: 403, description: "权限不足" })
    @ApiResponse({ status: 500, description: "获取备份列表失败" })
    @AllowNoPerm()
    async listBackups(@Query() query: FindBackupsDto): Promise<ResultData> {
        try {
            this.logger.log(`Listing backups with query: ${JSON.stringify(query)}`);

            const result = await this.backupService.listBackups(query);

            this.logger.log(`Found ${result.total} backups, returning ${result.list.length} items`);

            return ResultData.ok(
                {
                    list: result.list,
                    total: result.total,
                    page: query.page || 1,
                    size: query.size || 10,
                },
                "获取备份列表成功",
            );
        } catch (error) {
            this.logger.error(`Failed to list backups: ${error.message}`, error.stack);
            return ResultData.fail(HttpStatus.INTERNAL_SERVER_ERROR, `获取备份列表失败: ${error.message}`);
        }
    }

    /**
     * 获取备份统计信息
     * GET /backups/stats
     * 权限：仅超级管理员
     */
    @Get("stats")
    @ApiOperation({ summary: "获取备份统计信息" })
    @ApiResponse({ status: 200, description: "获取统计信息成功" })
    @ApiResponse({ status: 403, description: "权限不足" })
    @ApiResponse({ status: 500, description: "获取统计信息失败" })
    @AllowNoPerm()
    async getBackupStats(): Promise<ResultData> {
        try {
            this.logger.log("Getting backup statistics");

            const stats = await this.backupService.getBackupStats();

            this.logger.log(`Backup statistics: ${stats.totalBackups} total backups`);

            return ResultData.ok(stats, "获取统计信息成功");
        } catch (error) {
            this.logger.error(`Failed to get backup statistics: ${error.message}`, error.stack);
            return ResultData.fail(HttpStatus.INTERNAL_SERVER_ERROR, `获取统计信息失败: ${error.message}`);
        }
    }

    /**
     * 下载并解密备份文件
     * GET /backups/download?fileKey=xxx
     * 权限：仅超级管理员
     * 返回解密后的 .sql.gz 文件流
     */
    @Get("download")
    @ApiOperation({ summary: "下载并解密备份文件" })
    @ApiResponse({ status: 200, description: "下载成功，返回解密后的文件流" })
    @ApiResponse({ status: 400, description: "参数错误" })
    @ApiResponse({ status: 403, description: "权限不足" })
    @ApiResponse({ status: 404, description: "文件不存在" })
    @ApiResponse({ status: 500, description: "下载或解密失败" })
    @AllowNoPerm()
    @OperationLog({
        module: "backup",
        action: "download",
        description: "下载备份文件 {fileKey}",
        recordResponse: false, // 文件下载不需要记录响应数据
    })
    async downloadBackup(@Query("fileKey") fileKey: string, @Res() res: Response): Promise<void> {
        try {
            // 验证参数
            if (!fileKey) {
                this.logger.warn("Download request missing fileKey parameter");
                res.status(HttpStatus.BAD_REQUEST).json({
                    code: HttpStatus.BAD_REQUEST,
                    msg: "缺少 fileKey 参数",
                });
                return;
            }

            this.logger.log(`Downloading and decrypting backup file: ${fileKey}`);

            // 下载并解密备份文件
            const decryptedData = await this.backupService.downloadAndDecryptBackup(fileKey);

            // 从 fileKey 提取原始文件名（去掉 .enc 后缀）
            const originalFileName = fileKey.replace(/\.enc$/, "");

            // 设置响应头
            res.setHeader("Content-Type", "application/gzip");
            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(originalFileName)}"`);
            res.setHeader("Content-Length", decryptedData.length.toString());

            // 发送解密后的文件数据
            res.send(decryptedData);

            this.logger.log(`Backup file downloaded and decrypted successfully: ${fileKey}`);
        } catch (error) {
            this.logger.error(`Failed to download backup: ${error.message}`, error.stack);

            if (!res.headersSent) {
                if (error.message.includes("not found") || error.message.includes("不存在")) {
                    res.status(HttpStatus.NOT_FOUND).json({
                        code: HttpStatus.NOT_FOUND,
                        msg: `备份文件不存在: ${error.message}`,
                    });
                } else {
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                        code: HttpStatus.INTERNAL_SERVER_ERROR,
                        msg: `下载或解密失败: ${error.message}`,
                    });
                }
            }
        }
    }

    /**
     * 生成备份文件下载 URL
     * GET /backups/download-url?fileKey=xxx
     * 权限：仅超级管理员
     * 返回临时访问 URL（JSON 格式）
     * 注意：此接口返回的是加密文件的直接下载链接，不会自动解密
     */
    @Get("download-url")
    @ApiOperation({ summary: "生成备份文件下载链接（加密文件，需手动解密）" })
    @ApiResponse({ status: 200, description: "生成下载链接成功" })
    @ApiResponse({ status: 400, description: "参数错误" })
    @ApiResponse({ status: 403, description: "权限不足" })
    @ApiResponse({ status: 404, description: "文件不存在" })
    @ApiResponse({ status: 500, description: "生成链接失败" })
    @AllowNoPerm()
    async generateDownloadUrl(@Query("fileKey") fileKey: string): Promise<ResultData> {
        try {
            // 验证参数
            if (!fileKey) {
                this.logger.warn("Download URL request missing fileKey parameter");
                return ResultData.fail(HttpStatus.BAD_REQUEST, "缺少 fileKey 参数");
            }

            this.logger.log(`Generating download URL for backup file: ${fileKey}`);

            // 生成临时访问 URL（有效期 1 小时）
            const temporaryUrl = await this.backupService.generateDownloadUrl(fileKey, 3600);

            // 计算过期时间
            const expiresAt = new Date(Date.now() + 3600 * 1000);

            this.logger.log(`Generated temporary download URL for: ${fileKey}`);

            return ResultData.ok(
                {
                    temporaryUrl,
                    expiresAt,
                    expiresIn: 3600,
                },
                "生成下载链接成功",
            );
        } catch (error) {
            this.logger.error(`Failed to generate download URL: ${error.message}`, error.stack);

            if (error.message.includes("not found") || error.message.includes("不存在")) {
                return ResultData.fail(HttpStatus.NOT_FOUND, `备份文件不存在: ${error.message}`);
            } else {
                return ResultData.fail(HttpStatus.INTERNAL_SERVER_ERROR, `生成下载链接失败: ${error.message}`);
            }
        }
    }
}

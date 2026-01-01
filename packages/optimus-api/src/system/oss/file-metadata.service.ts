import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { plainToClass, classToPlain } from "class-transformer";

import { OssEntity, StorageProvider } from "./oss.entity";
import { FileResultDto, UserInfoDto } from "./dto/storage.dto";
import { ResultData } from "../../shared/utils/result";
import { AppHttpCode } from "../../shared/enums/code.enum";

/**
 * 文件元数据管理服务
 * 统一管理不同存储提供商的文件元数据
 */
@Injectable()
export class FileMetadataService {
    constructor(
        @InjectRepository(OssEntity)
        private readonly ossRepo: Repository<OssEntity>,
    ) {}

    /**
     * 创建文件元数据记录
     * @param fileResult 文件上传结果
     * @param user 用户信息
     * @param storageProvider 存储提供商
     * @param business 业务标识
     * @returns
     */
    async createFileRecord(
        fileResult: FileResultDto,
        user: UserInfoDto,
        storageProvider: StorageProvider,
        business?: string,
    ): Promise<OssEntity> {
        const ossEntity = plainToClass(OssEntity, {
            ossKey: fileResult.fileName,
            url: fileResult.url,
            thumbnail_url: fileResult.thumbnailUrl || "",
            size: fileResult.size,
            type: fileResult.mimeType,
            location: "", // OSS存储不需要本地路径
            business: business || "",
            userId: user.id,
            userAccount: user.account,
            storageProvider,
            fileKey: fileResult.fileKey || fileResult.fileName,
            cdnUrl: fileResult.cdnUrl,
        });

        return await this.ossRepo.save(ossEntity);
    }

    /**
     * 更新文件元数据
     * @param id 文件ID
     * @param updateData 更新数据
     * @returns
     */
    async updateFileRecord(id: number, updateData: Partial<OssEntity>): Promise<OssEntity | null> {
        const existingRecord = await this.ossRepo.findOne({ where: { id } });
        if (!existingRecord) {
            return null;
        }

        await this.ossRepo.update(id, updateData);
        return await this.ossRepo.findOne({ where: { id } });
    }

    /**
     * 删除文件元数据记录
     * @param id 文件ID
     * @returns
     */
    async deleteFileRecord(id: number): Promise<ResultData> {
        try {
            const fileRecord = await this.ossRepo.findOne({ where: { id } });
            if (!fileRecord) {
                return ResultData.fail(AppHttpCode.SERVICE_ERROR, "文件记录不存在");
            }

            await this.ossRepo.delete(id);
            return ResultData.ok({
                message: "文件记录删除成功",
                deletedRecord: classToPlain(fileRecord),
            });
        } catch (error) {
            console.error("删除文件记录失败:", error);
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, "删除文件记录失败");
        }
    }

    /**
     * 根据文件ID获取文件记录
     * @param id 文件ID
     * @returns
     */
    async getFileRecord(id: number): Promise<OssEntity | null> {
        try {
            return await this.ossRepo.findOne({ where: { id } });
        } catch (error) {
            console.error(`Error getting file record ${id}:`, error);
            return null;
        }
    }

    /**
     * 根据文件键名获取文件记录
     * @param fileKey 文件键名
     * @param storageProvider 存储提供商
     * @returns
     */
    async getFileRecordByKey(fileKey: string, storageProvider?: StorageProvider): Promise<OssEntity | null> {
        const where: any = { fileKey };
        if (storageProvider) {
            where.storageProvider = storageProvider;
        }
        return await this.ossRepo.findOne({ where });
    }

    /**
     * 批量创建文件记录
     * @param fileResults 文件上传结果列表
     * @param user 用户信息
     * @param storageProvider 存储提供商
     * @param business 业务标识
     * @returns
     */
    async createMultipleFileRecords(
        fileResults: FileResultDto[],
        user: UserInfoDto,
        storageProvider: StorageProvider,
        business?: string,
    ): Promise<OssEntity[]> {
        const ossEntities = fileResults.map((fileResult) =>
            plainToClass(OssEntity, {
                ossKey: fileResult.fileName,
                url: fileResult.url,
                thumbnail_url: fileResult.thumbnailUrl || "",
                size: fileResult.size,
                type: fileResult.mimeType,
                location: "", // OSS存储不需要本地路径
                business: business || "",
                userId: user.id,
                userAccount: user.account,
                storageProvider,
                fileKey: fileResult.fileKey || fileResult.fileName,
                cdnUrl: fileResult.cdnUrl,
            }),
        );

        return await this.ossRepo.save(ossEntities);
    }

    /**
     * 根据存储提供商统计文件数量
     * @param storageProvider 存储提供商
     * @returns
     */
    async countFilesByProvider(storageProvider: StorageProvider): Promise<number> {
        return await this.ossRepo.count({ where: { storageProvider } });
    }

    /**
     * 获取所有存储提供商的统计信息
     * @returns
     */
    async getStorageProviderStats(): Promise<Record<StorageProvider, number>> {
        const stats = {} as Record<StorageProvider, number>;

        const providers: StorageProvider[] = ["local", "minio", "aliyun"];

        for (const provider of providers) {
            stats[provider] = await this.countFilesByProvider(provider);
        }

        return stats;
    }

    /**
     * 迁移文件记录的存储提供商
     * @param id 文件ID
     * @param newProvider 新的存储提供商
     * @param newFileKey 新的文件键名
     * @param newUrl 新的文件URL
     * @param newCdnUrl 新的CDN URL
     * @returns
     */
    async migrateFileRecord(
        id: number,
        newProvider: StorageProvider,
        newFileKey: string,
        newUrl: string,
        newCdnUrl?: string,
    ): Promise<OssEntity | null> {
        const updateData: Partial<OssEntity> = {
            storageProvider: newProvider,
            fileKey: newFileKey,
            url: newUrl,
            cdnUrl: newCdnUrl,
        };

        return await this.updateFileRecord(id, updateData);
    }
}

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToClass, classToPlain } from "class-transformer";
import { Between, Repository } from "typeorm";
import fs from "fs";
import path from "path";

import { ResultData } from "../../shared/utils/result";
import { validUploadFile } from "../../shared/utils/validate";
import { AppHttpCode } from "../../shared/enums/code.enum";

import { OssEntity } from "./oss.entity";
import { FindOssDto } from "./dto/find-oss.dto";
import { FileHashCheckDto } from "./dto/large-uploadfile.dto";
import { FileStatus } from "./enums/large-upload.enum";

@Injectable()
export class OssService {
    private readonly chunkStoragePath: string; // 分片文件存储路径（统一使用 UPLOAD_TEMP_PATH）

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(OssEntity)
        private readonly ossRepo: Repository<OssEntity>,
    ) {
        // 分片文件存储路径（统一使用 UPLOAD_TEMP_PATH，与 WebSocket Gateway 保持一致）
        this.chunkStoragePath = this.config.get<string>("app.file.tempUpload") || "";
    }

    /**
     * 获取分片上传文件夹地址（统一使用 UPLOAD_TEMP_PATH）
     * @param hash
     * @param chunkSize
     * @returns
     */
    private getFileFolder(hash: string, chunkSize: number): string {
        return path.join(this.chunkStoragePath, `${hash}-${chunkSize}/`);
    }

    async findList(search: FindOssDto): Promise<ResultData> {
        const { size, page, startDay, endDay } = search;
        const where: any = {};
        if (startDay && endDay) {
            where.createDate = Between(`${startDay} 00:00:00`, `${endDay} 23:59:59`);
        }
        const res = await this.ossRepo.findAndCount({
            order: { id: "DESC" },
            skip: size * (page - 1), // 修复分页计算错误
            take: size,
            where,
        });
        return ResultData.ok({ list: classToPlain(res[0]), total: res[1] });
    }

    /**
     * 校验是否有分片文件存在，主要用于断点续传
     * @param file
     * @returns
     */
    checkFileExisting(file: FileHashCheckDto): ResultData {
        const chunksPath: string = this.getFileFolder(file.hash, file.chunkSize);
        const result = {
            type: FileStatus.Nominal,
            msg: "正常可上传",
            index: [],
        };
        if (file.name && !validUploadFile(file.name)) {
            return ResultData.fail(AppHttpCode.FILE_TYPE_ERROR, "禁止上传非法文件");
        }
        if (fs.existsSync(chunksPath)) {
            const chunks = fs.readdirSync(chunksPath);

            if (chunks.length === 0) {
                return ResultData.ok(result);
            }

            if (chunks.length === file.total) {
                result.type = FileStatus.Merge;
                result.msg = "已经存在相应的分片，请做 Merge 操作";
            } else {
                result.type = FileStatus.Continue;
                result.msg = "已经上传过一部分喔，让我们继续上传吧";
                result.index = chunks.map((item) => {
                    const chunksNameArr = item.split("-");
                    return Number(chunksNameArr[chunksNameArr.length - 1] || 0);
                });
            }
        }
        return ResultData.ok(result);
    }

    /**
     * 创建文件元数据记录（支持存储提供商信息）
     * @param fileData 文件数据
     * @returns
     */
    async createFileMetadata(fileData: Partial<OssEntity>): Promise<OssEntity> {
        const ossEntity = plainToClass(OssEntity, {
            ...fileData,
            storageProvider: fileData.storageProvider || "local",
            fileKey: fileData.fileKey || fileData.ossKey,
        });

        return await this.ossRepo.save(ossEntity);
    }

    /**
     * 更新文件元数据（包含存储提供商信息）
     * @param id 文件ID
     * @param updateData 更新数据
     * @returns
     */
    async updateFileMetadata(id: number, updateData: Partial<OssEntity>): Promise<OssEntity> {
        await this.ossRepo.update(id, updateData);
        return await this.ossRepo.findOne({ where: { id } });
    }

    /**
     * 根据存储提供商查询文件列表
     * @param storageProvider 存储提供商
     * @param search 查询条件
     * @returns
     */
    async findByStorageProvider(storageProvider: string, search: FindOssDto): Promise<ResultData> {
        const { size, page, startDay, endDay } = search;
        const where: any = { storageProvider };

        if (startDay && endDay) {
            where.createDate = Between(`${startDay} 00:00:00`, `${endDay} 23:59:59`);
        }

        const res = await this.ossRepo.findAndCount({
            order: { id: "DESC" },
            skip: size * (page - 1), // 修复分页计算错误
            take: size,
            where,
        });

        return ResultData.ok({ list: classToPlain(res[0]), total: res[1] });
    }
}

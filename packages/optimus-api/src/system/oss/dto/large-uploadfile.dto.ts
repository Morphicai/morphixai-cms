import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class WSUploadfileDto {
    @ApiProperty({ description: "上传文件实体", required: true })
    sliceBlob: Blob[];

    @ApiProperty({ description: "当前分片值", default: 0 })
    @Type(() => Number)
    index: number;

    @ApiProperty({ description: "分片大小", default: 0 })
    @Type(() => Number)
    chunkSize: number;

    @ApiProperty({ description: "原始文件大小", default: 0 })
    size: number;

    @ApiProperty({ description: "文件 Hash" })
    hash: string;

    @ApiProperty({ description: "文件名" })
    name: string;

    @ApiProperty({ description: "总分片数", default: 0 })
    total: number;
}

export class WSFileMergeDto {
    @ApiProperty({ description: "文件名", required: true })
    name: string;

    @ApiProperty({ description: "总进度", default: 0 })
    @Type(() => Number)
    total: number;

    @ApiProperty({ description: "分片大小", default: 0 })
    @Type(() => Number)
    chunkSize: number;

    @ApiProperty({ description: "hash" })
    hash: string;
}

export class FileHashCheckDto {
    @ApiProperty({ description: "总进度", default: 0 })
    @Type(() => Number)
    total: number;

    @ApiProperty({ description: "分片大小", default: 0 })
    @Type(() => Number)
    chunkSize: number;

    @ApiProperty({ description: "hash" })
    hash: string;

    @ApiProperty({ description: "文件名", default: "" })
    name?: string;
}

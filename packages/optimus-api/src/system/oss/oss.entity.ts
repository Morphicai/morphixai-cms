import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Exclude } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsIn, IsString, MaxLength } from "class-validator";

export type StorageProvider = "minio" | "aliyun" | "local";

@Entity("sys_oss")
export class OssEntity {
    @ApiProperty({ description: "id" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @ApiProperty({ description: "上传用户id" })
    @Column({ type: "bigint", name: "user_id", comment: "上传用户id" })
    public userId: string;

    @ApiProperty({ description: "上传用户帐号" })
    @Column({ type: "varchar", name: "user_account", length: 32, comment: "上传用户帐号" })
    public userAccount: string;

    @ApiProperty({ description: "文件 url" })
    @Column({ type: "varchar", comment: "文件 url" })
    public url: string;

    @ApiProperty({ description: "文件hash key" })
    @Column({ type: "varchar", comment: "文件hash key" })
    public ossKey: string;

    @ApiProperty({ description: "文件缩略图 url" })
    @Column({ type: "varchar", comment: "文件缩略图 url" })
    public thumbnail_url: string;

    @ApiProperty({ description: "文件size" })
    @Column({ type: "int", comment: "文件size" })
    public size: number;

    @ApiProperty({ description: "文件mimetype类型" })
    @Column({ type: "varchar", length: 20, comment: "文件mimetype类型" })
    public type: string;

    @ApiProperty({ description: "业务描述字段，可以字符串，也可以是 JSON 字符串" })
    @Column({ type: "varchar", length: 200, comment: "业务描述字段，可以字符串，也可以是 JSON 字符串" })
    public business: string;

    @Exclude({ toPlainOnly: true }) // 输出屏蔽
    @Column({ type: "varchar", length: 200, comment: "文件存放位置" })
    public location: string;

    @ApiProperty({
        description: "存储提供商类型",
        enum: ["minio", "aliyun", "local"],
        default: "local",
    })
    @Column({
        type: "varchar",
        name: "storage_provider",
        length: 20,
        default: "local",
        comment: "存储提供商类型 (minio, aliyun, local)",
    })
    @IsIn(["minio", "aliyun", "local"])
    public storageProvider: StorageProvider;

    @ApiProperty({ description: "存储文件键名" })
    @Column({
        type: "varchar",
        name: "file_key",
        length: 255,
        default: "",
        comment: "存储文件键名",
    })
    @IsString()
    @MaxLength(255)
    public fileKey: string;

    @ApiPropertyOptional({ description: "CDN加速地址" })
    @Column({
        type: "varchar",
        name: "cdn_url",
        length: 500,
        nullable: true,
        comment: "CDN加速地址",
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    public cdnUrl?: string;

    @ApiProperty({ description: "上传时间" })
    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "创建时间" })
    createDate: Date;
}

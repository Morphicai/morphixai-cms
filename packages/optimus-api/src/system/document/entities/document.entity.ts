import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsBoolean, MaxLength, MinLength, IsNotEmpty, IsArray, IsOptional } from "class-validator";

@Entity("op_sys_document")
export class DocumentEntity {
    @ApiProperty({ description: "文案中心唯一 ID" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @ApiProperty({ description: "文案中心 Key" })
    @IsString({ message: "docKey 必须为字符串类型" })
    @IsNotEmpty({ message: "docKey 不能为空" })
    @MinLength(2, { message: "docKey 至少2个字符" })
    @MaxLength(40, { message: "docKey 最多40个字符" })
    @Column({ type: "varchar", name: "doc_key", comment: "文案中心 Key" })
    public docKey: string;

    @ApiProperty({ description: "该文案中心是否需要展示在菜单上" })
    @IsBoolean({ message: "showOnMenu 必须为布尔型" })
    @Column({ type: "boolean", name: "show_on_menu", comment: "该文案中心是否需要展示在菜单上", default: false })
    public showOnMenu?: boolean;

    @ApiProperty({ description: "描述当前 Item 来源" })
    @Column({ type: "varchar", comment: "描述当前 Item 来源" })
    @IsString({ message: "source 必须为字符串类型" })
    @IsNotEmpty({ message: "source 不能为空" })
    @MinLength(2, { message: "source 至少2个字符" })
    @MaxLength(40, { message: "source 最多40个字符" })
    public source: string;

    @ApiProperty({ description: "当前文案 Item 类型" })
    @Column({ type: "varchar", comment: "当前文案 Item 类型" })
    @IsString({ message: "type 必须为字符串类型" })
    @IsNotEmpty({ message: "type 不能为空" })
    @MinLength(2, { message: "type 至少2个字符" })
    @MaxLength(40, { message: "type 最多40个字符" })
    public type: string;

    @ApiProperty({ description: "文案内容" })
    @Column({ type: "longtext", comment: "文案内容" })
    @IsString({ message: "content 必须为字符串类型" })
    @IsNotEmpty({ message: "content 不能为空" })
    public content: string;

    @ApiProperty({ description: "创建时间" })
    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "创建时间" })
    createDate: Date;

    @ApiProperty({ description: "操作人" })
    @Column({ type: "varchar", name: "user_id", comment: "操作人" })
    public userId: number;

    @ApiProperty({ description: "对当前文案 Item 的简要描述" })
    @Column({ type: "varchar", comment: "对当前文案 Item 的简要描述" })
    @IsString({ message: "description 必须为字符串类型" })
    @IsNotEmpty({ message: "description 不能为空" })
    @MinLength(2, { message: "description 至少2个字符" })
    @MaxLength(40, { message: "description 最多40个字符" })
    public description: string;

    @ApiProperty({ description: "是否对外公开" })
    @IsBoolean({ message: "isPublic 必须为布尔型" })
    @Column({
        type: "boolean",
        name: "is_public",
        comment: "是否对外公开",
        default: false,
    })
    public isPublic?: boolean;

    @ApiProperty({ description: "开启权限控制后的用户名单", required: false })
    @IsArray({ message: "权限列表中的用户名单必须为数组类型" })
    @IsOptional()
    public accountIdPerms?: number[];

    @ApiProperty({ description: "开启权限控制后的角色名单", required: false })
    @IsArray({ message: "权限列表中的角色名单必须为数组类型" })
    @IsOptional()
    public roleIdPerms?: number[];
}

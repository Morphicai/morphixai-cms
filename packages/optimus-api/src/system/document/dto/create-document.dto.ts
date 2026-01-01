import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, MinLength, IsBoolean, IsOptional } from "class-validator";
import { PermDocumentDto } from "./perm-document.dto";

export class CreateDocumentDto extends PermDocumentDto {
    @ApiProperty({ description: "文案中心 Key" })
    @IsString({ message: "docKey 必须为字符串类型" })
    @IsNotEmpty({ message: "docKey 不能为空" })
    readonly docKey: string;

    @ApiProperty({ description: "描述当前 Item 来源", required: false })
    @IsString({ message: "source 必须为字符串类型" })
    @IsNotEmpty({ message: "source 不能为空" })
    @MinLength(2, { message: "source 至少2个字符" })
    @MaxLength(40, { message: "source 最多40个字符" })
    readonly source: string;

    @ApiProperty({ description: "当前文案 Item 类型", required: false })
    @IsString({ message: "type 必须为字符串类型" })
    @IsNotEmpty({ message: "type 不能为空" })
    @MinLength(2, { message: "type 至少2个字符" })
    @MaxLength(40, { message: "type 最多40个字符" })
    readonly type: string;

    @ApiProperty({ description: "文案内容" })
    @IsString({ message: "content 必须为字符串类型" })
    @IsNotEmpty({ message: "content 不能为空" })
    readonly content: string;

    @ApiProperty({ description: "对当前文案 Item 的简要描述" })
    @IsString({ message: "description 必须为字符串类型" })
    @IsNotEmpty({ message: "description 不能为空" })
    @MinLength(2, { message: "description 至少2个字符" })
    @MaxLength(40, { message: "description 最多40个字符" })
    public description: string;

    @ApiProperty({ description: "该文案中心是否需要展示在菜单上", required: false })
    @IsBoolean({ message: "showOnMenu 必须为布尔型" })
    @IsOptional()
    public showOnMenu?: boolean;

    @ApiProperty({ description: "是否对外公开", required: false })
    @IsBoolean({ message: "isPublic 必须为布尔型" })
    @IsOptional()
    public isPublic?: boolean;
}

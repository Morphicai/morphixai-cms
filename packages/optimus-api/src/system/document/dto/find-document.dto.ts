import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class FindDocumentDto {
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
}

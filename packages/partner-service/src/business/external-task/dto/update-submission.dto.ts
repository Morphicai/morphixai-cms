import { IsString, IsOptional, IsArray, IsUrl, MaxLength, ArrayMinSize, ArrayMaxSize } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * 修改被拒绝的提交 DTO
 */
export class UpdateSubmissionDto {
    @ApiPropertyOptional({
        description: "任务链接（如果任务类型需要）",
        example: "https://twitter.com/user/status/123456",
    })
    @IsOptional()
    @IsUrl({}, { message: "任务链接格式不正确" })
    @MaxLength(500, { message: "任务链接长度不能超过500字符" })
    taskLink?: string;

    @ApiPropertyOptional({
        description: "证明图片URL数组",
        type: [String],
        example: ["https://cdn.example.com/image1.jpg", "https://cdn.example.com/image2.jpg"],
    })
    @IsOptional()
    @IsArray({ message: "证明图片必须是数组" })
    @IsString({ each: true, message: "每个图片URL必须是字符串" })
    @ArrayMinSize(1, { message: "至少需要上传1张图片" })
    @ArrayMaxSize(10, { message: "最多只能上传10张图片" })
    proofImages?: string[];

    @ApiPropertyOptional({
        description: "备注说明",
        example: "已重新上传清晰的截图",
        maxLength: 1000,
    })
    @IsOptional()
    @IsString({ message: "备注必须是字符串" })
    @MaxLength(1000, { message: "备注长度不能超过1000字符" })
    remark?: string;
}

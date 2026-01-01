import { IsEnum, IsString, IsOptional, IsArray, IsUrl, MaxLength, ArrayMaxSize, ArrayMinSize } from "class-validator";
import { ExternalTaskType } from "../enums/external-task-type.enum";

export class SubmitExternalTaskDto {
    @IsEnum(ExternalTaskType, { message: "无效的任务类型" })
    taskType: ExternalTaskType;

    @IsOptional()
    @IsUrl({}, { message: "任务链接格式不正确" })
    @MaxLength(500, { message: "任务链接长度不能超过500字符" })
    taskLink?: string;

    @IsOptional()
    @IsArray({ message: "证明图片必须是数组" })
    @IsString({ each: true, message: "每个图片URL必须是字符串" })
    @ArrayMaxSize(10, { message: "最多上传10张图片" })
    proofImages?: string[];

    @IsOptional()
    @IsString({ message: "备注必须是字符串" })
    @MaxLength(1000, { message: "备注长度不能超过1000字符" })
    remark?: string;
}

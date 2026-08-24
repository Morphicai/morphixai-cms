import { IsOptional, IsEnum, IsInt, Min, Max, IsString, IsDateString } from "class-validator";
import { Type } from "class-transformer";
import { SubmissionStatus } from "../enums/submission-status.enum";
import { ExternalTaskType } from "../enums/external-task-type.enum";

export class QuerySubmissionsDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: "页码必须是整数" })
    @Min(1, { message: "页码最小为1" })
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: "每页数量必须是整数" })
    @Min(1, { message: "每页数量最小为1" })
    @Max(100, { message: "每页数量最大为100" })
    pageSize?: number = 20;

    @IsOptional()
    @IsEnum(SubmissionStatus, { message: "无效的状态" })
    status?: SubmissionStatus;

    @IsOptional()
    @IsEnum(ExternalTaskType, { message: "无效的任务类型" })
    taskType?: ExternalTaskType;

    @IsOptional()
    @IsString({ message: "合伙人ID必须是字符串" })
    partnerId?: string;

    @IsOptional()
    @IsDateString({}, { message: "开始日期格式不正确" })
    startDate?: string;

    @IsOptional()
    @IsDateString({}, { message: "结束日期格式不正确" })
    endDate?: string;
}

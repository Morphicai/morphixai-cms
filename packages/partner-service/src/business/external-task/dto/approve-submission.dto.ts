import { IsOptional, IsString, MaxLength } from "class-validator";

export class ApproveSubmissionDto {
    @IsOptional()
    @IsString({ message: "审核备注必须是字符串" })
    @MaxLength(500, { message: "审核备注长度不能超过500字符" })
    reviewRemark?: string;
}

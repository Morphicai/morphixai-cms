import { IsString, MaxLength, IsNotEmpty } from "class-validator";

export class RejectSubmissionDto {
    @IsNotEmpty({ message: "拒绝原因不能为空" })
    @IsString({ message: "拒绝原因必须是字符串" })
    @MaxLength(500, { message: "拒绝原因长度不能超过500字符" })
    reviewRemark: string;
}

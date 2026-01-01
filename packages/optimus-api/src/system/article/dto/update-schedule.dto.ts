import { IsDateString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateScheduleDto {
    @ApiProperty({
        description: "预定发布时间，设置为null表示取消预定发布",
        example: "2025-11-04T10:00:00Z",
        required: false,
    })
    @IsDateString()
    @IsOptional()
    readonly scheduledAt?: string | null;
}

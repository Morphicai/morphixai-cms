import { IsString, IsOptional, IsObject, IsNumber } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * 任务完成通知DTO
 * C端调用此接口通知后端某个任务已完成
 */
export class NotifyTaskCompletionDto {
    @ApiProperty({
        description: "任务代码（如：GAME_LEVEL_UP, FIRST_RECHARGE 等）",
        example: "GAME_LEVEL_UP",
    })
    @IsString()
    taskCode: string;

    @ApiPropertyOptional({
        description: "任务相关的业务参数（JSON对象，不同任务类型参数不同）",
        example: { level: 10, timestamp: 1733472000000 },
    })
    @IsOptional()
    @IsObject()
    businessParams?: Record<string, any>;

    @ApiProperty({
        description: "事件发生时间（毫秒时间戳）",
        example: 1733472000000,
    })
    @IsNumber()
    eventTime: number;
}

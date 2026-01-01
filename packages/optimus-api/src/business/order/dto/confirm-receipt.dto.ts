import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * 确认收货请求 DTO
 */
export class ConfirmReceiptDto {
    @ApiProperty({ description: "订单号" })
    @IsString()
    @IsNotEmpty()
    orderNo: string;
}

/**
 * 确认收货响应 DTO
 */
export class ConfirmReceiptResponseDto {
    @ApiProperty({ description: "订单号" })
    orderNo: string;

    @ApiProperty({ description: "订单状态" })
    status: string;

    @ApiProperty({ description: "确认收货时间" })
    confirmTime: Date;
}

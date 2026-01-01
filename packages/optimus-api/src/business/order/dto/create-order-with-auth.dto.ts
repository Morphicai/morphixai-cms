import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * 创建订单请求 DTO（支持加密或明文传递认证信息）
 */
export class CreateOrderWithAuthDto {
    @ApiPropertyOptional({
        description: "加密的认证信息（包含 uid 和 authToken），如果提供此字段，则不需要提供 uid 和 authToken",
        example: "ivBase64:encryptedData",
    })
    @IsOptional()
    @IsString()
    encryptedAuth?: string;

    @ApiPropertyOptional({ description: "用户ID（如果未提供 encryptedAuth，则必填）" })
    @IsOptional()
    @IsString()
    uid?: string;

    @ApiPropertyOptional({ description: "认证Token（如果未提供 encryptedAuth，则必填）" })
    @IsOptional()
    @IsString()
    authToken?: string;

    @ApiProperty({ description: "产品ID", example: "MULTI_REGION_CREATE_ROLE" })
    @IsString()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({ description: "订单金额", example: 100.0 })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiPropertyOptional({ description: "游戏订单号" })
    @IsOptional()
    @IsString()
    cpOrderNo?: string;

    @ApiPropertyOptional({ description: "角色名" })
    @IsOptional()
    @IsString()
    roleName?: string;

    @ApiPropertyOptional({ description: "区服名" })
    @IsOptional()
    @IsString()
    serverName?: string;

    @ApiPropertyOptional({ description: "扩展参数（JSON对象）" })
    @IsOptional()
    extrasParams?: Record<string, any>;
}

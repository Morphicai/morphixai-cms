import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * 产品信息 DTO
 */
export class ProductDto {
    @ApiProperty({ description: "产品ID", example: "MULTI_REGION_CREATE_ROLE" })
    id: string;

    @ApiProperty({ description: "产品名称", example: "多区创建角色" })
    name: string;

    @ApiProperty({ description: "产品价格（元）", example: 1.0 })
    price: number;

    @ApiPropertyOptional({ description: "产品描述", example: "多区创建角色" })
    description?: string;
}

/**
 * 产品列表响应 DTO
 */
export class ProductListResponseDto {
    @ApiProperty({ description: "产品列表", type: [ProductDto] })
    products: ProductDto[];

    @ApiProperty({ description: "产品总数" })
    total: number;
}

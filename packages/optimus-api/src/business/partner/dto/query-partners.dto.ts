import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { PartnerStatus } from "../enums/partner-status.enum";

export class QueryPartnersDto {
    @ApiProperty({
        description: "合伙人编号",
        required: false,
        example: "LP123456",
    })
    @IsOptional()
    @IsString()
    partnerCode?: string;

    @ApiProperty({
        description: "合伙人状态",
        enum: PartnerStatus,
        required: false,
        example: PartnerStatus.ACTIVE,
    })
    @IsOptional()
    @IsEnum(PartnerStatus)
    status?: PartnerStatus;

    @ApiProperty({
        description: "页码",
        example: 1,
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page: number = 1;

    @ApiProperty({
        description: "每页数量",
        example: 10,
        minimum: 1,
        maximum: 100,
    })
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    pageSize: number = 10;
}

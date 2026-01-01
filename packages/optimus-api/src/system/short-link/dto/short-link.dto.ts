import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsEnum, IsOptional, IsNumber, Length, MaxLength } from "class-validator";
import { Type } from "class-transformer";
import { ShortLinkStatus, ShortLinkSource } from "../entities/short-link.entity";

/**
 * 短链来源说明：
 *
 * 1. ADMIN (admin) - 后台管理创建
 *    - 用途：管理员在后台手动创建的短链
 *    - target 格式：支持多平台配置的 JSON 对象
 *    - 示例：{ android: "url1", ios: "url2", pc: "url3", default: "url4" }
 *
 * 2. SYSTEM (system) - 系统服务创建
 *    - 用途：系统服务自动创建，用于存储参数字符串
 *    - target 格式：查询字符串或 JSON 字符串
 *    - 示例：inviterCode=LP123456&channelCode=ABC123
 *
 * 3. API (api) - API接口创建
 *    - 用途：通过 API 接口创建的短链
 *    - target 格式：灵活，支持字符串或对象
 */

/**
 * 创建短链DTO
 */
export class CreateShortLinkDto {
    @ApiPropertyOptional({ description: "6位短链token（不传则自动生成）", example: "abc123" })
    @IsOptional()
    @IsString()
    @Length(6, 6, { message: "token必须为6位" })
    token?: string;

    @ApiProperty({
        description: "目标内容（JSON格式，支持多平台配置）",
        example: {
            android: "https://example.com/android?param=value",
            ios: "https://example.com/ios?param=value",
            pc: "https://example.com/pc?param=value",
            default: "https://example.com?param=value",
        },
    })
    target: any;

    @ApiPropertyOptional({ description: "来源", enum: ShortLinkSource })
    @IsOptional()
    @IsEnum(ShortLinkSource)
    source?: ShortLinkSource;

    @ApiPropertyOptional({ description: "扩展字段（JSON格式）", example: { channel: "wechat", campaign: "spring" } })
    @IsOptional()
    extra?: any;

    @ApiPropertyOptional({ description: "备注说明", example: "推广渠道A的邀请链接" })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    remark?: string;
}

/**
 * 更新短链DTO
 */
export class UpdateShortLinkDto {
    @ApiPropertyOptional({
        description: "目标内容（JSON格式，支持多平台配置）",
        example: {
            android: "https://example.com/android?param=value",
            ios: "https://example.com/ios?param=value",
            pc: "https://example.com/pc?param=value",
        },
    })
    @IsOptional()
    target?: any;

    @ApiPropertyOptional({ description: "状态", enum: ShortLinkStatus })
    @IsOptional()
    @IsEnum(ShortLinkStatus)
    status?: ShortLinkStatus;

    @ApiPropertyOptional({ description: "是否禁用" })
    @IsOptional()
    disabled?: boolean;

    @ApiPropertyOptional({ description: "扩展字段（JSON格式）" })
    @IsOptional()
    extra?: any;

    @ApiPropertyOptional({ description: "备注说明" })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    remark?: string;
}

/**
 * 查询短链DTO
 */
export class QueryShortLinkDto {
    @ApiPropertyOptional({ description: "token（模糊搜索）" })
    @IsOptional()
    @IsString()
    token?: string;

    @ApiPropertyOptional({ description: "目标内容（模糊搜索）" })
    @IsOptional()
    @IsString()
    target?: string;

    @ApiPropertyOptional({ description: "状态", enum: ShortLinkStatus })
    @IsOptional()
    @IsEnum(ShortLinkStatus)
    status?: ShortLinkStatus;

    @ApiPropertyOptional({ description: "来源", enum: ShortLinkSource })
    @IsOptional()
    @IsEnum(ShortLinkSource)
    source?: ShortLinkSource;

    @ApiPropertyOptional({ description: "是否禁用" })
    @IsOptional()
    disabled?: boolean;

    @ApiPropertyOptional({ description: "页码", example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ description: "每页数量", example: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    pageSize?: number;
}

/**
 * 短链信息DTO
 */
export class ShortLinkInfoDto {
    @ApiProperty({ description: "ID" })
    id: number;

    @ApiProperty({ description: "6位短链token" })
    token: string;

    @ApiProperty({
        description: "目标内容（JSON格式）",
        example: {
            android: "https://example.com/android",
            ios: "https://example.com/ios",
            pc: "https://example.com/pc",
        },
    })
    target: any;

    @ApiProperty({ description: "状态", enum: ShortLinkStatus })
    status: ShortLinkStatus;

    @ApiProperty({ description: "来源", enum: ShortLinkSource })
    source: ShortLinkSource;

    @ApiProperty({ description: "是否禁用" })
    disabled: boolean;

    @ApiProperty({ description: "使用次数" })
    useCount: number;

    @ApiPropertyOptional({ description: "最后使用时间" })
    lastUsedAt?: Date;

    @ApiPropertyOptional({ description: "扩展字段" })
    extra?: any;

    @ApiPropertyOptional({ description: "创建人ID" })
    createdBy?: number;

    @ApiPropertyOptional({ description: "备注说明" })
    remark?: string;

    @ApiProperty({ description: "创建时间" })
    createdAt: Date;

    @ApiProperty({ description: "更新时间" })
    updatedAt: Date;
}

/**
 * 短链原始信息DTO（用于管理后台，返回原始 target 数据）
 */
export class ShortLinkRawInfoDto {
    @ApiProperty({ description: "ID" })
    id: number;

    @ApiProperty({ description: "6位短链token" })
    token: string;

    @ApiProperty({
        description: "目标内容（原始格式，字符串）",
        example: "inviterCode=LP946971&channelCode=P9GHGF",
    })
    targetRaw: string;

    @ApiProperty({ description: "状态", enum: ShortLinkStatus })
    status: ShortLinkStatus;

    @ApiProperty({ description: "来源", enum: ShortLinkSource })
    source: ShortLinkSource;

    @ApiProperty({ description: "是否禁用" })
    disabled: boolean;

    @ApiProperty({ description: "使用次数" })
    useCount: number;

    @ApiPropertyOptional({ description: "最后使用时间" })
    lastUsedAt?: Date;

    @ApiPropertyOptional({ description: "扩展字段" })
    extra?: any;

    @ApiPropertyOptional({ description: "创建人ID" })
    createdBy?: number;

    @ApiPropertyOptional({ description: "备注说明" })
    remark?: string;

    @ApiProperty({ description: "创建时间" })
    createdAt: Date;

    @ApiProperty({ description: "更新时间" })
    updatedAt: Date;
}

/**
 * 短链原始列表响应DTO
 */
export class ShortLinkRawListResponseDto {
    @ApiProperty({ description: "短链列表", type: [ShortLinkRawInfoDto] })
    items: ShortLinkRawInfoDto[];

    @ApiProperty({ description: "总数" })
    total: number;

    @ApiProperty({ description: "当前页码" })
    page: number;

    @ApiProperty({ description: "每页数量" })
    pageSize: number;
}

/**
 * 短链列表响应DTO
 */
export class ShortLinkListResponseDto {
    @ApiProperty({ description: "短链列表", type: [ShortLinkInfoDto] })
    items: ShortLinkInfoDto[];

    @ApiProperty({ description: "总数" })
    total: number;

    @ApiProperty({ description: "当前页码" })
    page: number;

    @ApiProperty({ description: "每页数量" })
    pageSize: number;
}

/**
 * 解析短链DTO
 */
export class ResolveShortLinkDto {
    @ApiProperty({
        description: "目标内容（JSON格式）",
        example: {
            android: "https://example.com/android",
            ios: "https://example.com/ios",
            pc: "https://example.com/pc",
        },
    })
    target: any;
}

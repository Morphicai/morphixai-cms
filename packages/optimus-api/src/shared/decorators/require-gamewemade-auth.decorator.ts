import { SetMetadata, CustomDecorator } from "@nestjs/common";

/**
 * GameWemade 认证元数据键
 */
export const REQUIRE_GAMEWEMADE_AUTH_KEY = "require_gamewemade_auth";

/**
 * GameWemade UID Header 字段名常量
 */
export const GAMEWEMADE_UID_HEADER = "gamewemade-uid";

/**
 * GameWemade 签名 Header 字段名常量
 */
export const GAMEWEMADE_SIGNATURE_HEADER = "business-sign";

/**
 * GameWemade 时间戳 Header 字段名常量
 */
export const GAMEWEMADE_TIMESTAMP_HEADER = "business-timestamp";

/**
 * GameWemade 认证配置
 */
export interface GameWemadeAuthOptions {
    /** uid 字段名，默认为 'gamewemade-uid' */
    uidField?: string;
    /** 签名字段名，默认为 'business-sign' */
    signatureField?: string;
    /** 时间戳字段名，默认为 'business-timestamp' */
    timestampField?: string;
    /** 是否必需，默认为 true */
    required?: boolean;
}

/**
 * 要求 GameWemade 认证装饰器
 *
 * 用于标记需要验证签名的接口
 * 参数必须从 HTTP Headers 中传递，字段名默认为 'gamewemade-uid'、'business-sign' 和 'business-timestamp'
 *
 * @param options 认证配置选项
 *
 * @example
 * ```typescript
 * // 使用默认 Header 字段名（gamewemade-uid、business-sign 和 business-timestamp）
 * @Post('create')
 * @UseGuards(GameWemadeAuthGuard)
 * @RequireGameWemadeAuth()
 * async createOrder(@Body() dto: CreateOrderDto) {}
 *
 * // 自定义 Header 字段名
 * @Get('verify')
 * @UseGuards(GameWemadeAuthGuard)
 * @RequireGameWemadeAuth({
 *   uidField: 'custom-uid',
 *   signatureField: 'custom-sign',
 *   timestampField: 'custom-timestamp'
 * })
 * async verify(@Req() req: Express.Request) {}
 * ```
 */
export function RequireGameWemadeAuth(options?: GameWemadeAuthOptions): CustomDecorator<string> {
    const defaultOptions: GameWemadeAuthOptions = {
        uidField: GAMEWEMADE_UID_HEADER,
        signatureField: GAMEWEMADE_SIGNATURE_HEADER,
        timestampField: GAMEWEMADE_TIMESTAMP_HEADER,
        required: true,
    };

    return SetMetadata(REQUIRE_GAMEWEMADE_AUTH_KEY, { ...defaultOptions, ...options });
}

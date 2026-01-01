import { SetMetadata, CustomDecorator } from "@nestjs/common";

/**
 * 客户端用户认证元数据键
 */
export const REQUIRE_CLIENT_USER_AUTH_KEY = "require_client_user_auth";

/**
 * 客户端用户 UID Header 字段名常量
 */
export const CLIENT_USER_UID_HEADER = "client-uid";

/**
 * 客户端用户签名 Header 字段名常量
 */
export const CLIENT_USER_SIGNATURE_HEADER = "client-sign";

/**
 * 客户端用户时间戳 Header 字段名常量
 */
export const CLIENT_USER_TIMESTAMP_HEADER = "client-timestamp";

/**
 * 客户端用户认证配置
 */
export interface ClientUserAuthOptions {
    /** uid 字段名，默认为 'client-uid' */
    uidField?: string;
    /** 签名字段名，默认为 'client-sign' */
    signatureField?: string;
    /** 时间戳字段名，默认为 'client-timestamp' */
    timestampField?: string;
    /** 是否必需，默认为 true */
    required?: boolean;
}

/**
 * 要求客户端用户认证装饰器
 *
 * 用于标记需要验证客户端用户签名的接口
 * 参数必须从 HTTP Headers 中传递，字段名默认为 'client-uid'、'client-sign' 和 'client-timestamp'
 * 使用独立的签名密钥 CLIENT_USER_SIGN_KEY
 *
 * @param options 认证配置选项
 *
 * @example
 * ```typescript
 * // 使用默认 Header 字段名（client-uid、client-sign 和 client-timestamp）
 * @Post('create')
 * @UseGuards(ClientUserAuthGuard)
 * @RequireClientUserAuth()
 * async createOrder(@Body() dto: CreateOrderDto) {}
 *
 * // 自定义 Header 字段名
 * @Get('verify')
 * @UseGuards(ClientUserAuthGuard)
 * @RequireClientUserAuth({
 *   uidField: 'custom-uid',
 *   signatureField: 'custom-sign',
 *   timestampField: 'custom-timestamp'
 * })
 * async verify(@Req() req: Express.Request) {}
 * ```
 */
export function RequireClientUserAuth(options?: ClientUserAuthOptions): CustomDecorator<string> {
    const defaultOptions: ClientUserAuthOptions = {
        uidField: CLIENT_USER_UID_HEADER,
        signatureField: CLIENT_USER_SIGNATURE_HEADER,
        timestampField: CLIENT_USER_TIMESTAMP_HEADER,
        required: true,
    };

    return SetMetadata(REQUIRE_CLIENT_USER_AUTH_KEY, { ...defaultOptions, ...options });
}

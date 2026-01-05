import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import {
    REQUIRE_CLIENT_USER_AUTH_KEY,
    ClientUserAuthOptions,
    CLIENT_USER_UID_HEADER,
    CLIENT_USER_SIGNATURE_HEADER,
    CLIENT_USER_TIMESTAMP_HEADER,
} from "../decorators/require-client-user-auth.decorator";
import { generateSign } from "../utils/sign.util";
import { UserIdentity, UserSource } from "../interfaces/user-identity.interface";

/**
 * 客户端用户认证守卫
 *
 * 用于验证客户端请求中的签名是否有效
 * 参数必须从 HTTP Headers 中传递，字段名默认为 'client-uid'、'client-sign' 和 'client-timestamp'
 * 签名包含：uid、请求体、query 参数、时间戳
 * 使用独立的签名密钥 CLIENT_USER_SIGN_KEY
 *
 * @example
 * ```typescript
 * // 在控制器中使用
 * @Controller('order')
 * export class OrderController {
 *   @Post('create')
 *   @UseGuards(ClientUserAuthGuard)
 *   @RequireClientUserAuth()
 *   async createOrder(@Body() dto: CreateOrderDto, @Req() req: Express.Request) {
 *     // 签名已验证，可以从 req.clientUser 获取用户信息
 *     const user = req.clientUser!;
 *   }
 * }
 * ```
 */
@Injectable()
export class ClientUserAuthGuard implements CanActivate {
    private readonly logger = new Logger(ClientUserAuthGuard.name);
    private readonly TIMESTAMP_TOLERANCE = 5 * 60 * 1000; // 5 分钟容差（毫秒）

    constructor(private readonly reflector: Reflector, private readonly configService: ConfigService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 获取装饰器配置
        const options = this.reflector.getAllAndOverride<ClientUserAuthOptions>(REQUIRE_CLIENT_USER_AUTH_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // 如果没有配置，不进行验证
        if (!options) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        // 开发环境跳过签名验证
        const nodeEnv = this.configService.get<string>("NODE_ENV") || process.env.NODE_ENV;
        if (nodeEnv === "development") {
            // 从 Headers 获取 UID（开发环境仍需要 UID）
            const uidField = options.uidField || CLIENT_USER_UID_HEADER;
            const uid = request.headers?.[uidField.toLowerCase()] as string | undefined;

            if (uid) {
                // 将用户信息附加到请求对象上
                request.clientUser = {
                    userId: uid,
                    userSource: UserSource.WEMADE, // 开发环境默认为 WeMade
                };
                this.logger.debug(`[开发环境] 跳过签名验证，UID: ${uid}`);
                return true;
            } else if (!options.required) {
                // 如果不是必需的，直接放行
                return true;
            }
            // 如果是必需的但没有 UID，继续执行后续验证逻辑
        }

        const {
            uidField = CLIENT_USER_UID_HEADER,
            signatureField = CLIENT_USER_SIGNATURE_HEADER,
            timestampField = CLIENT_USER_TIMESTAMP_HEADER,
            required = true,
        } = options;

        // 从 HTTP Headers 获取参数（不区分大小写）
        const uid = request.headers?.[uidField.toLowerCase()] as string | undefined;
        const signature = request.headers?.[signatureField.toLowerCase()] as string | undefined;
        const timestamp = request.headers?.[timestampField.toLowerCase()] as string | undefined;

        // 检查必需参数
        if (required) {
            if (!uid) {
                throw new BadRequestException(`缺少必需参数: ${uidField}`);
            }
            if (!signature) {
                throw new BadRequestException(`缺少必需参数: ${signatureField}`);
            }
            if (!timestamp) {
                throw new BadRequestException(`缺少必需参数: ${timestampField}`);
            }
        }

        // 如果参数不存在且不是必需的，直接放行
        if (!uid || !signature || !timestamp) {
            return true;
        }

        // 验证时间戳（防止重放攻击）
        try {
            const timestampNum = parseInt(timestamp, 10);
            if (isNaN(timestampNum)) {
                throw new BadRequestException(`时间戳格式无效: ${timestamp}`);
            }

            const now = Date.now();
            const timestampMs = timestampNum > 1000000000000 ? timestampNum : timestampNum * 1000; // 支持秒和毫秒时间戳
            const timeDiff = Math.abs(now - timestampMs);

            if (timeDiff > this.TIMESTAMP_TOLERANCE) {
                this.logger.warn(`时间戳过期: uid=${uid}, timestamp=${timestamp}, diff=${timeDiff}ms`);
                throw new UnauthorizedException("请求已过期，请重新发起请求");
            }
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`时间戳验证失败: ${error.message}`);
        }

        // 获取客户端用户签名密钥（独立的环境变量）
        const signKey = this.configService.get<string>("CLIENT_USER_SIGN_KEY") || process.env.CLIENT_USER_SIGN_KEY;

        if (!signKey) {
            this.logger.error("客户端用户签名密钥未配置");
            throw new UnauthorizedException("认证服务未配置");
        }

        // 获取请求体和 query 参数
        const body = request.body || {};
        const query = request.query || {};

        // 合并参数：uid、请求体、query 参数、时间戳
        const signParams: Record<string, any> = {
            uid,
            ...body,
            ...query,
            timestamp,
        };

        this.logger.log("========== 客户端用户签名验证开始 ==========");
        this.logger.log(`请求路径: ${request.method} ${request.url}`);
        this.logger.log(`UID: ${uid}`);
        this.logger.log(`时间戳: ${timestamp}`);
        this.logger.log(`接收到的签名: ${signature}`);
        this.logger.log(`请求体 (body):`, JSON.stringify(body));
        this.logger.log(`查询参数 (query):`, JSON.stringify(query));
        this.logger.log(`合并后的签名参数:`, JSON.stringify(signParams));

        // 生成签名
        try {
            const calculatedSign = generateSign(signParams, signKey);

            // 比较签名（不区分大小写）
            if (calculatedSign.toLowerCase() !== signature.toLowerCase()) {
                this.logger.warn("========== 签名验证失败 ==========");
                this.logger.warn(`UID: ${uid}`);
                this.logger.warn(`期望的签名: ${calculatedSign}`);
                this.logger.warn(`接收到的签名: ${signature}`);
                this.logger.warn(`签名参数: ${JSON.stringify(signParams)}`);
                this.logger.warn("====================================");
                throw new UnauthorizedException("签名验证失败");
            }

            // 将验证后的用户信息附加到请求对象上，方便后续使用
            request.clientUser = {
                userId: uid,
                userSource: UserSource.WEMADE, // 默认为 WeMade
            };

            this.logger.log("========== 签名验证成功 ==========");
            this.logger.log(`UID: ${uid}`);
            this.logger.log(`签名: ${calculatedSign}`);
            this.logger.log("====================================\n");
            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`签名验证异常: ${error.message}`, error.stack);
            throw new UnauthorizedException(`签名验证异常: ${error.message}`);
        }
    }
}

// Note: Express.Request.clientUser type is declared in user-identity.interface.ts

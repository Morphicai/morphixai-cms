import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GameWemadeSDK } from "./client";
import { SDKConfig } from "./types";

/**
 * GameWemade SDK 全局服务
 *
 * 提供全局的 GameWemadeSDK 实例，方便在整个应用中使用
 *
 * @example
 * ```typescript
 * import { GameWemadeSDKService } from '@/shared/libs/gamewemade/gamewemade.service';
 *
 * constructor(private readonly gameWemadeSDK: GameWemadeSDKService) {}
 *
 * async someMethod() {
 *   const result = await this.gameWemadeSDK.checkToken({
 *     authToken: 'token',
 *     uid: '123'
 *   });
 * }
 * ```
 */
@Injectable()
export class GameWemadeSDKService implements OnModuleInit {
    private readonly logger = new Logger(GameWemadeSDKService.name);
    private sdk: GameWemadeSDK | null = null;

    constructor(private readonly configService: ConfigService) {}

    /**
     * 模块初始化时创建 SDK 实例
     */
    onModuleInit() {
        try {
            const config = this.getSDKConfig();
            if (config) {
                this.sdk = new GameWemadeSDK(config);
                this.logger.log("GameWemade SDK 初始化成功");
            } else {
                this.logger.warn("GameWemade SDK 配置不完整，SDK 功能将不可用");
            }
        } catch (error) {
            this.logger.error(`GameWemade SDK 初始化失败: ${error.message}`, error.stack);
        }
    }

    /**
     * 获取 SDK 配置
     */
    private getSDKConfig(): SDKConfig | null {
        // 优先使用 ConfigService，如果不存在则使用 process.env
        const openId = this.configService.get<string>("GAMEWEMADE_SDK_OPEN_ID") || process.env.GAMEWEMADE_SDK_OPEN_ID;
        const openKey =
            this.configService.get<string>("GAMEWEMADE_SDK_OPEN_KEY") || process.env.GAMEWEMADE_SDK_OPEN_KEY;
        const productCode =
            this.configService.get<string>("GAMEWEMADE_SDK_PRODUCT_CODE") || process.env.GAMEWEMADE_SDK_PRODUCT_CODE;

        if (!openId || !openKey || !productCode) {
            this.logger.warn(
                `GameWemade SDK 配置缺失: OPEN_ID=${!!openId}, OPEN_KEY=${!!openKey}, PRODUCT_CODE=${!!productCode}`,
            );
            return null;
        }

        return {
            openId,
            openKey,
            productCode,
            baseUrl:
                this.configService.get<string>("GAMEWEMADE_SDK_BASE_URL") ||
                process.env.GAMEWEMADE_SDK_BASE_URL ||
                "http://custom-sdkapi.gamewemade.com",
            channelCode:
                this.configService.get<string>("GAMEWEMADE_SDK_CHANNEL_CODE") ||
                process.env.GAMEWEMADE_SDK_CHANNEL_CODE ||
                "website",
        };
    }

    /**
     * 获取 SDK 实例
     * @throws Error 如果 SDK 未初始化
     */
    getSDK(): GameWemadeSDK {
        if (!this.sdk) {
            throw new Error("GameWemade SDK 未初始化，请检查环境变量配置");
        }
        return this.sdk;
    }

    /**
     * 检查 SDK 是否已初始化
     */
    isInitialized(): boolean {
        return this.sdk !== null;
    }

    /**
     * 通用请求方法
     * @param endpoint API 端点路径
     * @param params 请求参数
     */
    async request<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
        const sdk = this.getSDK();
        const result = await sdk.request<T>(endpoint, params);
        return result.data;
    }

    /**
     * 检查 Token
     * @param params Token检查参数
     */
    async checkToken(params: { authToken: string; uid?: string }) {
        const sdk = this.getSDK();
        return sdk.checkToken(params);
    }

    /**
     * 获取配置信息
     */
    getConfig(): SDKConfig | null {
        if (!this.sdk) {
            return null;
        }
        return this.sdk.getConfig();
    }
}

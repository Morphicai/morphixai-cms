import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { GameWemadeSDKService } from "../../../shared/libs/gamewemade/gamewemade.service";
import { MemoryCache } from "../../../shared/cache/memory-cache";

/**
 * Token 验证结果缓存
 */
interface TokenValidationCache {
    uid: string;
    authToken: string;
    username?: string;
    isValid: boolean;
    validatedAt: number;
}

/**
 * GameWemade Token 验证服务
 * 使用内存缓存避免频繁校验
 */
@Injectable()
export class GameWemadeTokenValidationService {
    private readonly logger = new Logger(GameWemadeTokenValidationService.name);
    private cache: MemoryCache<TokenValidationCache>;

    constructor(private readonly gameWemadeSDK: GameWemadeSDKService) {
        // 初始化缓存：最多缓存 1000 个验证结果，缓存 5 分钟
        this.cache = new MemoryCache<TokenValidationCache>({
            maxSize: 1000,
            indexKeys: ["uid", "authToken"],
        });
    }

    /**
     * 验证 uid 和 authToken
     * @param uid 用户ID
     * @param authToken 认证Token
     * @returns 验证结果，包含用户信息
     */
    async validateToken(
        uid: string,
        authToken: string,
    ): Promise<{ uid: string; authToken: string; username?: string }> {
        if (!this.gameWemadeSDK.isInitialized()) {
            throw new UnauthorizedException("GameWemade SDK 未正确配置");
        }

        // 生成缓存键
        const cacheKey = `${uid}:${authToken}`;

        // 检查缓存
        const cached = this.cache.get(cacheKey);
        if (cached && cached.isValid) {
            this.logger.debug(`Token 验证命中缓存: uid=${uid}`);
            return {
                uid: cached.uid,
                authToken: cached.authToken,
                username: cached.username,
            };
        }

        // 调用 SDK 验证 Token
        try {
            const result = await this.gameWemadeSDK.checkToken({
                authToken,
                uid,
            });

            if (!result.status) {
                // 验证失败，缓存失败结果（缓存时间较短）
                this.cache.set(
                    cacheKey,
                    {
                        uid,
                        authToken,
                        isValid: false,
                        validatedAt: Date.now(),
                    },
                    60000, // 失败结果缓存 1 分钟
                );
                throw new UnauthorizedException(`Token 验证失败: ${result.message}`);
            }

            // 验证成功，缓存成功结果
            const cacheData: TokenValidationCache = {
                uid: result.data.uid,
                authToken,
                username: result.data.username,
                isValid: true,
                validatedAt: Date.now(),
            };

            this.cache.set(cacheKey, cacheData, 5 * 60 * 1000); // 成功结果缓存 5 分钟

            this.logger.debug(`Token 验证成功: uid=${uid}, username=${result.data.username}`);

            return {
                uid: result.data.uid,
                authToken,
                username: result.data.username,
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.error(`Token 验证异常: ${error.message}`, error.stack);
            throw new UnauthorizedException(`Token 验证异常: ${error.message}`);
        }
    }

    /**
     * 清除指定用户的缓存
     * @param uid 用户ID
     */
    clearCache(uid: string): void {
        // 通过索引查找并删除
        const cached = this.cache.findByIndexKeyValue("uid", uid);
        if (cached) {
            // MemoryCache 没有直接通过索引删除的方法，这里需要遍历删除
            // 简化处理：清空所有缓存（实际项目中可以优化）
            this.cache.clear();
            this.logger.debug(`已清除用户缓存: uid=${uid}`);
        }
    }

    /**
     * 获取缓存统计信息
     */
    getCacheStats(): { size: number; hitRate: number } {
        return {
            size: this.cache.size,
            hitRate: this.cache.getHitRate(),
        };
    }
}

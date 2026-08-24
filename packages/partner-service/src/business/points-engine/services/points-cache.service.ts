import { Injectable, Logger } from "@nestjs/common";
import { MemoryCache } from "../../../shared/cache/memory-cache";

/**
 * 积分缓存项
 */
interface PointsCacheEntry {
    partnerId: string;
    totalPoints: number;
    lastUpdated: number;
}

/**
 * 积分明细缓存项
 */
interface PointsDetailCacheEntry {
    partnerId: string;
    details: Array<{
        taskCode: string;
        taskType: string;
        points: number;
        businessParams: Record<string, any> | null;
        createdAt: Date;
    }>;
    lastUpdated: number;
}

/**
 * 本月积分缓存项
 */
interface MonthlyPointsCacheEntry {
    partnerId: string;
    month: string; // 格式: YYYY-MM
    monthlyPoints: number;
    lastUpdated: number;
}

/**
 * 积分缓存服务
 * 负责缓存用户积分总额和积分明细
 * 当前使用内存缓存，后续可扩展为 Redis
 */
@Injectable()
export class PointsCacheService {
    private readonly logger = new Logger(PointsCacheService.name);

    // 积分总额缓存
    private readonly pointsCache: MemoryCache<PointsCacheEntry>;

    // 积分明细缓存
    private readonly detailCache: MemoryCache<PointsDetailCacheEntry>;

    // 本月积分缓存
    private readonly monthlyCache: MemoryCache<MonthlyPointsCacheEntry>;

    // 缓存配置
    private readonly POINTS_CACHE_TTL = 5 * 60 * 1000; // 5分钟
    private readonly DETAIL_CACHE_TTL = 5 * 60 * 1000; // 5分钟
    private readonly MONTHLY_CACHE_TTL = 5 * 60 * 1000; // 5分钟

    constructor() {
        // 初始化积分总额缓存
        this.pointsCache = new MemoryCache<PointsCacheEntry>({
            maxSize: 1000, // 最多缓存1000个用户的积分
            indexKeys: ["partnerId"], // 按 partnerId 索引
        });

        // 初始化积分明细缓存
        this.detailCache = new MemoryCache<PointsDetailCacheEntry>({
            maxSize: 500, // 最多缓存500个用户的明细
            indexKeys: ["partnerId"], // 按 partnerId 索引
        });

        // 初始化本月积分缓存
        this.monthlyCache = new MemoryCache<MonthlyPointsCacheEntry>({
            maxSize: 1000, // 最多缓存1000个用户的本月积分
            indexKeys: ["partnerId", "month"], // 按 partnerId 和 month 索引
        });

        this.logger.log("积分缓存服务已初始化");
    }

    /**
     * 获取缓存的积分总额
     * @param partnerId 合伙人ID
     * @returns 积分总额，如果缓存未命中返回 undefined
     */
    getTotalPoints(partnerId: string): number | undefined {
        const entry = this.pointsCache.findByIndexKeyValue("partnerId", partnerId);

        if (entry) {
            this.logger.debug(`积分总额缓存命中: partnerId=${partnerId}, points=${entry.totalPoints}`);
            return entry.totalPoints;
        }

        this.logger.debug(`积分总额缓存未命中: partnerId=${partnerId}`);
        return undefined;
    }

    /**
     * 设置积分总额缓存
     * @param partnerId 合伙人ID
     * @param totalPoints 积分总额
     */
    setTotalPoints(partnerId: string, totalPoints: number): void {
        const entry: PointsCacheEntry = {
            partnerId,
            totalPoints,
            lastUpdated: Date.now(),
        };

        const cacheKey = `points:${partnerId}`;
        this.pointsCache.set(cacheKey, entry, this.POINTS_CACHE_TTL);

        this.logger.debug(`积分总额已缓存: partnerId=${partnerId}, points=${totalPoints}`);
    }

    /**
     * 获取缓存的积分明细
     * @param partnerId 合伙人ID
     * @returns 积分明细列表，如果缓存未命中返回 undefined
     */
    getPointsDetail(partnerId: string): PointsDetailCacheEntry["details"] | undefined {
        const entry = this.detailCache.findByIndexKeyValue("partnerId", partnerId);

        if (entry) {
            this.logger.debug(`积分明细缓存命中: partnerId=${partnerId}, count=${entry.details.length}`);
            return entry.details;
        }

        this.logger.debug(`积分明细缓存未命中: partnerId=${partnerId}`);
        return undefined;
    }

    /**
     * 设置积分明细缓存
     * @param partnerId 合伙人ID
     * @param details 积分明细列表
     */
    setPointsDetail(
        partnerId: string,
        details: Array<{
            taskCode: string;
            taskType: string;
            points: number;
            businessParams: Record<string, any> | null;
            createdAt: Date;
        }>,
    ): void {
        const entry: PointsDetailCacheEntry = {
            partnerId,
            details,
            lastUpdated: Date.now(),
        };

        const cacheKey = `detail:${partnerId}`;
        this.detailCache.set(cacheKey, entry, this.DETAIL_CACHE_TTL);

        this.logger.debug(`积分明细已缓存: partnerId=${partnerId}, count=${details.length}`);
    }

    /**
     * 获取缓存的本月积分
     * @param partnerId 合伙人ID
     * @param month 月份（格式: YYYY-MM），不传则使用当前月份
     * @returns 本月积分，如果缓存未命中返回 undefined
     */
    getMonthlyPoints(partnerId: string, month?: string): number | undefined {
        const targetMonth = month || this.getCurrentMonth();
        const entry = this.monthlyCache.findByIndexKeyValue("partnerId", partnerId);

        if (entry && entry.month === targetMonth) {
            this.logger.debug(
                `本月积分缓存命中: partnerId=${partnerId}, month=${targetMonth}, points=${entry.monthlyPoints}`,
            );
            return entry.monthlyPoints;
        }

        this.logger.debug(`本月积分缓存未命中: partnerId=${partnerId}, month=${targetMonth}`);
        return undefined;
    }

    /**
     * 设置本月积分缓存
     * @param partnerId 合伙人ID
     * @param monthlyPoints 本月积分
     * @param month 月份（格式: YYYY-MM），不传则使用当前月份
     */
    setMonthlyPoints(partnerId: string, monthlyPoints: number, month?: string): void {
        const targetMonth = month || this.getCurrentMonth();
        const entry: MonthlyPointsCacheEntry = {
            partnerId,
            month: targetMonth,
            monthlyPoints,
            lastUpdated: Date.now(),
        };

        const cacheKey = `monthly:${partnerId}:${targetMonth}`;
        this.monthlyCache.set(cacheKey, entry, this.MONTHLY_CACHE_TTL);

        this.logger.debug(`本月积分已缓存: partnerId=${partnerId}, month=${targetMonth}, points=${monthlyPoints}`);
    }

    /**
     * 获取当前月份（格式: YYYY-MM）
     */
    private getCurrentMonth(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    /**
     * 使指定用户的缓存失效
     * @param partnerId 合伙人ID
     */
    invalidateUserCache(partnerId: string): void {
        const pointsKey = `points:${partnerId}`;
        const detailKey = `detail:${partnerId}`;
        const currentMonth = this.getCurrentMonth();
        const monthlyKey = `monthly:${partnerId}:${currentMonth}`;

        this.pointsCache.delete(pointsKey);
        this.detailCache.delete(detailKey);
        this.monthlyCache.delete(monthlyKey);

        this.logger.log(`用户缓存已失效: partnerId=${partnerId}`);
    }

    /**
     * 清空所有缓存
     */
    clearAll(): void {
        this.pointsCache.clear();
        this.detailCache.clear();
        this.monthlyCache.clear();
        this.logger.log("所有积分缓存已清空");
    }

    /**
     * 获取缓存统计信息
     */
    getCacheStats(): {
        points: {
            size: number;
            hitRate: number;
        };
        detail: {
            size: number;
            hitRate: number;
        };
        monthly: {
            size: number;
            hitRate: number;
        };
    } {
        return {
            points: {
                size: this.pointsCache.size,
                hitRate: this.pointsCache.getHitRate(),
            },
            detail: {
                size: this.detailCache.size,
                hitRate: this.detailCache.getHitRate(),
            },
            monthly: {
                size: this.monthlyCache.size,
                hitRate: this.monthlyCache.getHitRate(),
            },
        };
    }
}

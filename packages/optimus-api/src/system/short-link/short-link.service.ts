import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ShortLinkEntity, ShortLinkStatus, ShortLinkSource } from "./entities/short-link.entity";
import {
    CreateShortLinkDto,
    UpdateShortLinkDto,
    QueryShortLinkDto,
    ShortLinkInfoDto,
    ShortLinkListResponseDto,
} from "./dto/short-link.dto";
import { MemoryCache } from "../../shared/cache/memory-cache";

/**
 * 短链服务
 */
@Injectable()
export class ShortLinkService {
    private readonly logger = new Logger(ShortLinkService.name);
    private readonly cache: MemoryCache<{ token: string; target: string }>;

    constructor(
        @InjectRepository(ShortLinkEntity)
        private readonly shortLinkRepository: Repository<ShortLinkEntity>,
    ) {
        // 初始化缓存：最多缓存1000个短链，支持通过token索引查询，缓存1小时
        this.cache = new MemoryCache({
            maxSize: 1000,
            indexKeys: ["token"],
        });
    }

    /**
     * 生成6位随机token
     */
    private generateToken(): string {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let token = "";
        for (let i = 0; i < 6; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    /**
     * 创建短链
     */
    async create(dto: CreateShortLinkDto, userId?: number, source?: ShortLinkSource): Promise<ShortLinkInfoDto> {
        let token = dto.token;

        // 如果没有提供token，自动生成
        if (!token) {
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
                token = this.generateToken();
                const existing = await this.shortLinkRepository.findOne({ where: { token } });
                if (!existing) {
                    break;
                }
                attempts++;
            }

            if (attempts >= maxAttempts) {
                throw new BadRequestException("生成token失败，请稍后重试");
            }
        } else {
            // 检查token是否已存在
            const existing = await this.shortLinkRepository.findOne({ where: { token } });
            if (existing) {
                throw new BadRequestException(`token已存在: ${token}`);
            }
        }

        const shortLink = this.shortLinkRepository.create({
            token,
            target: dto.target,
            remark: dto.remark,
            source: source || dto.source || ShortLinkSource.ADMIN,
            extra: dto.extra,
            createdBy: userId,
        });

        const saved = await this.shortLinkRepository.save(shortLink);
        this.logger.log(`创建短链: ${token} -> ${dto.target}`);

        // 添加到缓存（1小时过期）
        this.cache.set(token, { token, target: dto.target }, 3600000);

        return this.toDto(saved);
    }

    /**
     * 更新短链
     */
    async update(id: number, dto: UpdateShortLinkDto): Promise<ShortLinkInfoDto> {
        const shortLink = await this.shortLinkRepository.findOne({ where: { id } });

        if (!shortLink) {
            throw new NotFoundException("短链不存在");
        }

        Object.assign(shortLink, dto);
        const saved = await this.shortLinkRepository.save(shortLink);

        this.logger.log(`更新短链: ${shortLink.token}`);

        // 更新缓存
        if (dto.target || dto.status) {
            this.cache.delete(shortLink.token);
            if (saved.status === ShortLinkStatus.ACTIVE) {
                this.cache.set(shortLink.token, { token: shortLink.token, target: saved.target }, 3600000);
            }
        }

        return this.toDto(saved);
    }

    /**
     * 删除短链
     */
    async delete(id: number): Promise<void> {
        const shortLink = await this.shortLinkRepository.findOne({ where: { id } });

        if (!shortLink) {
            throw new NotFoundException("短链不存在");
        }

        await this.shortLinkRepository.delete(id);

        // 从缓存中删除
        this.cache.delete(shortLink.token);

        this.logger.log(`删除短链: ${shortLink.token}`);
    }

    /**
     * 查询短链列表
     */
    async findAll(dto: QueryShortLinkDto): Promise<ShortLinkListResponseDto> {
        const { token, target, status, source, disabled, page = 1, pageSize = 20 } = dto;

        const queryBuilder = this.shortLinkRepository.createQueryBuilder("short_link");

        if (token) {
            queryBuilder.andWhere("short_link.token LIKE :token", { token: `%${token}%` });
        }

        if (target) {
            queryBuilder.andWhere("short_link.target LIKE :target", { target: `%${target}%` });
        }

        if (status) {
            queryBuilder.andWhere("short_link.status = :status", { status });
        }

        if (source) {
            queryBuilder.andWhere("short_link.source = :source", { source });
        }

        if (disabled !== undefined) {
            queryBuilder.andWhere("short_link.disabled = :disabled", { disabled });
        }

        queryBuilder.orderBy("short_link.id", "DESC");

        const skip = (page - 1) * pageSize;
        queryBuilder.skip(skip).take(pageSize);

        const [items, total] = await queryBuilder.getManyAndCount();

        return {
            items: items.map((item) => this.toDto(item)),
            total,
            page,
            pageSize,
        };
    }

    /**
     * 查询短链列表（返回原始 target 数据，用于管理后台）
     */
    async findAllRaw(dto: QueryShortLinkDto): Promise<any> {
        const { token, target, status, source, disabled, page = 1, pageSize = 20 } = dto;

        // 使用 getRawMany 直接获取原始数据，绕过 transformer
        const queryBuilder = this.shortLinkRepository
            .createQueryBuilder("short_link")
            .select([
                "short_link.id as id",
                "short_link.token as token",
                "short_link.target as targetRaw",
                "short_link.status as status",
                "short_link.source as source",
                "short_link.disabled as disabled",
                "short_link.use_count as useCount",
                "short_link.last_used_at as lastUsedAt",
                "short_link.extra as extra",
                "short_link.created_by as createdBy",
                "short_link.remark as remark",
                "short_link.created_at as createdAt",
                "short_link.updated_at as updatedAt",
            ]);

        if (token) {
            queryBuilder.andWhere("short_link.token LIKE :token", { token: `%${token}%` });
        }

        if (target) {
            queryBuilder.andWhere("short_link.target LIKE :target", { target: `%${target}%` });
        }

        if (status) {
            queryBuilder.andWhere("short_link.status = :status", { status });
        }

        if (source) {
            queryBuilder.andWhere("short_link.source = :source", { source });
        }

        if (disabled !== undefined) {
            queryBuilder.andWhere("short_link.disabled = :disabled", { disabled });
        }

        queryBuilder.orderBy("short_link.id", "DESC");

        const skip = (page - 1) * pageSize;
        queryBuilder.offset(skip).limit(pageSize);

        // 获取原始数据和总数
        const items = await queryBuilder.getRawMany();

        // 获取总数
        const countQuery = this.shortLinkRepository.createQueryBuilder("short_link");
        if (token) {
            countQuery.andWhere("short_link.token LIKE :token", { token: `%${token}%` });
        }
        if (target) {
            countQuery.andWhere("short_link.target LIKE :target", { target: `%${target}%` });
        }
        if (status) {
            countQuery.andWhere("short_link.status = :status", { status });
        }
        if (source) {
            countQuery.andWhere("short_link.source = :source", { source });
        }
        if (disabled !== undefined) {
            countQuery.andWhere("short_link.disabled = :disabled", { disabled });
        }
        const total = await countQuery.getCount();

        return {
            items,
            total,
            page,
            pageSize,
        };
    }

    /**
     * 根据ID获取短链
     */
    async findOne(id: number): Promise<ShortLinkInfoDto> {
        const shortLink = await this.shortLinkRepository.findOne({ where: { id } });

        if (!shortLink) {
            throw new NotFoundException("短链不存在");
        }

        return this.toDto(shortLink);
    }

    /**
     * 解析短链token，获取目标内容
     */
    async resolve(token: string, platform?: string): Promise<any> {
        // 先从缓存查询
        const cached = this.cache.findByIndexKeyValue("token", token);
        if (cached) {
            this.logger.debug(`缓存命中: ${token}`);
            // 异步更新使用统计（不阻塞响应）
            this.updateUsageStats(token).catch((err) => this.logger.error(`更新使用统计失败: ${err.message}`));
            return this.getTargetByPlatform(cached.target, platform);
        }

        // 缓存未命中，查询数据库
        const shortLink = await this.shortLinkRepository.findOne({
            where: { token, status: ShortLinkStatus.ACTIVE, disabled: false },
        });

        if (!shortLink) {
            throw new NotFoundException(`短链不存在或已失效: ${token}`);
        }

        this.logger.log(`解析短链: ${token} (缓存命中率: ${(this.cache.getHitRate() * 100).toFixed(2)}%)`);

        // 更新使用统计
        await this.updateUsageStats(token);

        // 添加到缓存（1小时过期）
        this.cache.set(token, { token, target: shortLink.target }, 3600000);

        return this.getTargetByPlatform(shortLink.target, platform);
    }

    /**
     * 根据平台获取目标内容
     * 兼容两种场景：
     * 1. 管理后台：target 是对象 { android: "...", ios: "...", pc: "..." }
     * 2. 服务调用：target 是字符串 "param1=value1&param2=value2"
     */
    private getTargetByPlatform(target: any, platform?: string): any {
        // 场景1: target是字符串（服务方式缩短参数）
        if (typeof target === "string") {
            return target;
        }

        // 场景2: target不是对象，直接返回
        if (typeof target !== "object" || target === null) {
            return target;
        }

        // 场景3: target是对象（管理后台多平台配置）
        // 如果没有指定平台，返回整个target对象
        if (!platform) {
            return target;
        }

        // 返回指定平台的配置，如果不存在则返回default（默认），都不存在返回整个对象
        return target[platform] || target.default || target;
    }

    /**
     * 更新使用统计
     */
    private async updateUsageStats(token: string): Promise<void> {
        await this.shortLinkRepository
            .createQueryBuilder()
            .update(ShortLinkEntity)
            .set({
                useCount: () => "use_count + 1",
                lastUsedAt: new Date(),
            })
            .where("token = :token", { token })
            .execute();
    }

    /**
     * 便捷方法：通过token获取目标内容（用于代码中）
     */
    async getTarget(token: string, platform?: string): Promise<any> {
        return this.resolve(token, platform);
    }

    /**
     * 便捷方法：创建或更新短链（用于代码中）
     * 支持字符串或对象格式的target
     */
    async upsert(token: string, target: any, remark?: string, source?: ShortLinkSource): Promise<ShortLinkInfoDto> {
        const existing = await this.shortLinkRepository.findOne({ where: { token } });

        if (existing) {
            existing.target = target;
            if (remark !== undefined) {
                existing.remark = remark;
            }
            const saved = await this.shortLinkRepository.save(existing);
            this.logger.log(`更新短链: ${token}`);

            // 更新缓存
            this.cache.delete(token);
            if (saved.status === ShortLinkStatus.ACTIVE) {
                this.cache.set(token, { token, target }, 3600000);
            }

            return this.toDto(saved);
        } else {
            return this.create({ token, target, remark, source }, undefined, source);
        }
    }

    /**
     * 便捷方法：缩短参数（用于服务调用）
     * 自动生成token，将参数字符串转为短链
     */
    async shorten(params: string | Record<string, any>, remark?: string): Promise<{ token: string; url: string }> {
        // 如果是对象，转为查询字符串
        const target = typeof params === "string" ? params : new URLSearchParams(params).toString();

        // 创建短链
        const shortLink = await this.create(
            {
                target,
                remark,
                source: ShortLinkSource.SYSTEM,
            },
            undefined,
            ShortLinkSource.SYSTEM,
        );

        return {
            token: shortLink.token,
            url: `/public/short-link/resolve/${shortLink.token}`,
        };
    }

    /**
     * 转换为DTO
     */
    private toDto(entity: ShortLinkEntity): ShortLinkInfoDto {
        // target 字段已经通过 entity 的 transformer 处理，直接使用即可
        return {
            id: entity.id,
            token: entity.token,
            target: entity.target,
            status: entity.status,
            source: entity.source,
            disabled: entity.disabled,
            useCount: entity.useCount,
            lastUsedAt: entity.lastUsedAt,
            extra: entity.extra,
            createdBy: entity.createdBy,
            remark: entity.remark,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}

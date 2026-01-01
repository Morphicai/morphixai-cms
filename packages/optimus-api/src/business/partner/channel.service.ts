import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { PartnerChannelEntity } from "./entities/partner-channel.entity";
import { PartnerProfileEntity } from "./entities/partner-profile.entity";
import { ChannelStatus } from "./enums/channel-status.enum";
import { PartnerStatus } from "./enums/partner-status.enum";
import {
    ChannelNotBelongToInviterException,
    InvalidChannelException,
    InvalidPartnerIdException,
    PartnerFrozenException,
    ChannelLimitExceededException,
} from "./exceptions/partner.exception";
import { ShortLinkService } from "../../system/short-link/short-link.service";
import { TaskCompletionLogEntity } from "../points-engine/entities/task-completion-log.entity";
import { PointsService } from "../points-engine/services/points.service";

@Injectable()
export class ChannelService {
    private readonly logger = new Logger(ChannelService.name);
    private readonly MAX_CHANNELS_PER_PARTNER = 50; // 每个合伙人最多创建50个推广链接

    constructor(
        @InjectRepository(PartnerChannelEntity)
        private readonly channelRepository: Repository<PartnerChannelEntity>,
        @InjectRepository(PartnerProfileEntity)
        private readonly profileRepository: Repository<PartnerProfileEntity>,
        @InjectRepository(TaskCompletionLogEntity)
        private readonly taskLogRepository: Repository<TaskCompletionLogEntity>,
        private readonly shortLinkService: ShortLinkService,
        private readonly pointsService: PointsService,
    ) {}

    /**
     * 生成唯一的渠道码（6位字母+数字）
     */
    async generateChannelCode(partnerId: string): Promise<string> {
        const maxRetries = 10;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        for (let i = 0; i < maxRetries; i++) {
            // 生成6位随机字母数字组合
            let code = "";
            for (let j = 0; j < 6; j++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            // 检查是否在该合伙人的渠道中已存在
            const existing = await this.channelRepository.findOne({
                where: { partnerId, channelCode: code },
            });

            if (!existing) {
                return code;
            }
        }

        // 如果10次都失败，使用时间戳+随机字符确保唯一性
        const timestamp = Date.now().toString().slice(-3);
        const randomChars = chars
            .substring(0, 3)
            .split("")
            .sort(() => Math.random() - 0.5)
            .join("");
        return `${timestamp}${randomChars}`;
    }

    /**
     * 验证自定义渠道码是否已存在
     */
    async isChannelCodeExists(partnerId: string, channelCode: string): Promise<boolean> {
        const existing = await this.channelRepository.findOne({
            where: { partnerId, channelCode },
        });
        return existing !== null;
    }

    /**
     * 创建推广渠道
     */
    async createChannel(partnerId: string, name: string, customChannelCode?: string): Promise<PartnerChannelEntity> {
        // 验证合伙人存在且状态为active
        const partner = await this.profileRepository.findOne({
            where: { partnerId },
        });

        if (!partner) {
            throw new InvalidPartnerIdException(Number(partnerId));
        }

        if (partner.status === PartnerStatus.FROZEN) {
            throw new PartnerFrozenException(partner.partnerCode);
        }

        // 检查推广链接数量限制
        const channelCount = await this.channelRepository.count({
            where: { partnerId },
        });

        if (channelCount >= this.MAX_CHANNELS_PER_PARTNER) {
            this.logger.warn(
                `合伙人 ${partnerId} 已达到推广链接数量上限: ${channelCount}/${this.MAX_CHANNELS_PER_PARTNER}`,
            );
            throw new ChannelLimitExceededException(this.MAX_CHANNELS_PER_PARTNER);
        }

        // 确定渠道码：使用自定义或自动生成
        let channelCode: string;
        if (customChannelCode) {
            // 检查自定义渠道码是否已存在
            const exists = await this.isChannelCodeExists(partnerId, customChannelCode);
            if (exists) {
                throw new Error(`渠道码 ${customChannelCode} 已存在`);
            }
            channelCode = customChannelCode;
        } else {
            // 自动生成唯一渠道码
            channelCode = await this.generateChannelCode(partnerId);
        }

        // 生成推广链接（短链token）
        const shortUrl = await this.generateReferralLink(partner.partnerCode, channelCode);

        // 创建渠道
        const channel = this.channelRepository.create({
            partnerId,
            channelCode,
            name,
            shortUrl,
            status: ChannelStatus.ACTIVE,
        });

        const savedChannel = await this.channelRepository.save(channel);
        this.logger.log(`合伙人 ${partnerId} 创建渠道成功: ${channelCode} - ${name}, 短链token: ${shortUrl}`);

        return savedChannel;
    }

    /**
     * 生成推广链接（使用短链服务）
     */
    async generateReferralLink(partnerCode: string, channelCode: string): Promise<string> {
        try {
            // 使用短链服务生成token
            const params = {
                inviterCode: partnerCode,
                channelCode: channelCode,
            };

            const result = await this.shortLinkService.shorten(
                params,
                `合伙人推广渠道: ${partnerCode} - ${channelCode}`,
            );

            // 返回短链token（前端可以拼接完整URL）
            return result.token;
        } catch (error) {
            this.logger.error(`生成短链失败: ${error.message}`, error.stack);
            // 降级方案：返回传统链接
            const baseUrl = process.env.REFERRAL_BASE_URL || "https://example.com";
            return `${baseUrl}?inviter=${partnerCode}&channel=${channelCode}`;
        }
    }

    /**
     * 获取合伙人的所有渠道
     */
    async getChannels(partnerId: string, status?: ChannelStatus): Promise<PartnerChannelEntity[]> {
        const where: any = { partnerId };
        if (status) {
            where.status = status;
        }

        return this.channelRepository.find({
            where,
            order: { createdAt: "DESC" },
        });
    }

    /**
     * 通过渠道码查询渠道
     */
    async getChannelByCode(partnerId: string, channelCode: string): Promise<PartnerChannelEntity | null> {
        return this.channelRepository.findOne({
            where: { partnerId, channelCode },
        });
    }

    /**
     * 验证渠道是否有效（存在且active）
     */
    async validateChannel(partnerId: string, channelCode: string): Promise<boolean> {
        const channel = await this.getChannelByCode(partnerId, channelCode);
        return channel !== null && channel.status === ChannelStatus.ACTIVE;
    }

    /**
     * 禁用渠道
     * @param channelId 渠道ID
     * @param partnerId 合伙人ID（用于验证所有权）
     */
    async disableChannel(channelId: string, partnerId: string): Promise<void> {
        const channel = await this.channelRepository.findOne({
            where: { id: channelId },
        });

        if (!channel) {
            throw new InvalidChannelException(channelId);
        }

        // 验证渠道所有权
        if (channel.partnerId !== partnerId) {
            throw new ChannelNotBelongToInviterException(channel.channelCode, partnerId);
        }

        // 更新状态为disabled，不删除记录（保留历史数据）
        channel.status = ChannelStatus.DISABLED;
        await this.channelRepository.save(channel);

        this.logger.log(`合伙人 ${partnerId} 禁用渠道 ${channelId} (${channel.channelCode})`);
    }

    /**
     * 获取单个渠道统计
     * @param channelId 渠道ID
     * @param partnerId 合伙人ID（用于验证所有权）
     */
    async getChannelStatistics(
        channelId: string,
        partnerId: string,
    ): Promise<{
        memberCount: number;
        totalMira: string;
        thisMonthMira: string;
        conversionRate: number;
    }> {
        // 验证渠道存在且属于该合伙人
        const channel = await this.channelRepository.findOne({
            where: { id: channelId },
        });

        if (!channel) {
            throw new InvalidChannelException(channelId);
        }

        if (channel.partnerId !== partnerId) {
            throw new ChannelNotBelongToInviterException(channel.channelCode, partnerId);
        }

        // 统计通过该渠道加入的成员数量
        // 需要从 partner_hierarchy 表查询 source_channel_id = channelId 的记录
        const memberCount = await this.channelRepository.manager.query(
            `
            SELECT COUNT(*) as count
            FROM biz_partner_hierarchy
            WHERE source_channel_id = ?
              AND level = 1
              AND is_active = 1
        `,
            [channelId],
        );

        const count = parseInt(memberCount[0]?.count || "0", 10);

        // 获取通过该渠道加入的所有成员ID
        const channelMembers = await this.channelRepository.manager.query(
            `
            SELECT child_partner_id
            FROM biz_partner_hierarchy
            WHERE source_channel_id = ?
              AND level = 1
              AND is_active = 1
        `,
            [channelId],
        );

        const memberIds = channelMembers.map((m: any) => m.child_partner_id);

        // 统计该渠道成员为我贡献的累计积分和本月积分
        let totalMira = 0;
        let thisMonthMira = 0;

        if (memberIds.length > 0) {
            // 查询我的任务日志中，relatedPartnerId 在该渠道成员列表中的记录
            const allLogs = await this.taskLogRepository.find({
                where: {
                    partnerId, // 我的ID
                },
            });

            // 筛选出该渠道成员为我贡献的记录
            const channelContributionLogs = allLogs.filter(
                (log) => log.relatedPartnerId && memberIds.includes(log.relatedPartnerId),
            );

            // 计算累计贡献
            for (const log of channelContributionLogs) {
                const points = await this.pointsService["calculateLogPoints"](log);
                if (points > 0) {
                    totalMira += points;
                }
            }

            // 计算本月贡献
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const monthlyContributionLogs = channelContributionLogs.filter((log) => log.createdAt >= firstDayOfMonth);

            for (const log of monthlyContributionLogs) {
                const points = await this.pointsService["calculateLogPoints"](log);
                if (points > 0) {
                    thisMonthMira += points;
                }
            }
        }

        const totalMiraStr = totalMira.toString();
        const thisMonthMiraStr = thisMonthMira.toString();

        // 转化率（暂时返回0，需要访问统计支持）
        // TODO: 实现转化率统计，需要记录渠道访问次数
        const conversionRate = 0;

        this.logger.log(`渠道统计: channelId=${channelId}, memberCount=${count}`);

        return {
            memberCount: count,
            totalMira: totalMiraStr,
            thisMonthMira: thisMonthMiraStr,
            conversionRate,
        };
    }

    /**
     * 获取所有渠道汇总统计
     * @param partnerId 合伙人ID
     */
    async getChannelsSummary(partnerId: string): Promise<{
        totalChannels: number;
        activeChannels: number;
        totalMembers: number;
        totalMira: string;
        thisMonthMira: string;
        channels: Array<{
            channelId: string;
            channelCode: string;
            name: string;
            shortUrl: string | null;
            memberCount: number;
            totalMira: string;
            thisMonthMira: string;
        }>;
    }> {
        // 获取该合伙人的所有渠道
        const channels = await this.channelRepository.find({
            where: { partnerId },
            order: { createdAt: "DESC" },
        });

        const totalChannels = channels.length;
        const activeChannels = channels.filter((c) => c.status === ChannelStatus.ACTIVE).length;

        // 统计每个渠道的成员数
        const channelStats = await Promise.all(
            channels.map(async (channel) => {
                const memberCountResult = await this.channelRepository.manager.query(
                    `
                    SELECT COUNT(*) as count
                    FROM biz_partner_hierarchy
                    WHERE source_channel_id = ?
                      AND level = 1
                      AND is_active = 1
                `,
                    [channel.id],
                );

                const memberCount = parseInt(memberCountResult[0]?.count || "0", 10);

                // 获取该渠道的所有成员ID
                const channelMembersResult = await this.channelRepository.manager.query(
                    `
                    SELECT child_partner_id
                    FROM biz_partner_hierarchy
                    WHERE source_channel_id = ?
                      AND level = 1
                      AND is_active = 1
                `,
                    [channel.id],
                );

                const memberIds = channelMembersResult.map((m: any) => m.child_partner_id);

                // 统计该渠道成员为我贡献的累计积分和本月积分
                let channelTotalMira = 0;
                let channelThisMonthMira = 0;

                if (memberIds.length > 0) {
                    // 查询我的任务日志中，relatedPartnerId 在该渠道成员列表中的记录
                    const allLogs = await this.taskLogRepository.find({
                        where: {
                            partnerId, // 我的ID
                        },
                    });

                    // 筛选出该渠道成员为我贡献的记录
                    const channelContributionLogs = allLogs.filter(
                        (log) => log.relatedPartnerId && memberIds.includes(log.relatedPartnerId),
                    );

                    // 计算累计贡献
                    for (const log of channelContributionLogs) {
                        const points = await this.pointsService["calculateLogPoints"](log);
                        if (points > 0) {
                            channelTotalMira += points;
                        }
                    }

                    // 计算本月贡献
                    const now = new Date();
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                    const monthlyContributionLogs = channelContributionLogs.filter(
                        (log) => log.createdAt >= firstDayOfMonth,
                    );

                    for (const log of monthlyContributionLogs) {
                        const points = await this.pointsService["calculateLogPoints"](log);
                        if (points > 0) {
                            channelThisMonthMira += points;
                        }
                    }
                }

                return {
                    channelId: channel.id,
                    channelCode: channel.channelCode,
                    name: channel.name,
                    shortUrl: channel.shortUrl,
                    memberCount,
                    totalMira: channelTotalMira.toString(),
                    thisMonthMira: channelThisMonthMira.toString(),
                };
            }),
        );

        // 计算总成员数和汇总积分
        const totalMembers = channelStats.reduce((sum, stat) => sum + stat.memberCount, 0);
        const totalMira = channelStats.reduce((sum, stat) => sum + parseInt(stat.totalMira || "0", 10), 0);
        const thisMonthMira = channelStats.reduce((sum, stat) => sum + parseInt(stat.thisMonthMira || "0", 10), 0);

        this.logger.log(
            `渠道汇总统计: partnerId=${partnerId}, totalChannels=${totalChannels}, totalMembers=${totalMembers}`,
        );

        return {
            totalChannels,
            activeChannels,
            totalMembers,
            totalMira: totalMira.toString(),
            thisMonthMira: thisMonthMira.toString(),
            channels: channelStats,
        };
    }
}

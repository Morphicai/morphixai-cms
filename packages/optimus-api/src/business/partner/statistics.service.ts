import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, In } from "typeorm";
import { PartnerProfileEntity } from "./entities/partner-profile.entity";
import { PartnerHierarchyEntity } from "./entities/partner-hierarchy.entity";
import { PartnerChannelEntity } from "./entities/partner-channel.entity";
import { TaskCompletionLogEntity } from "../points-engine/entities/task-completion-log.entity";
import { PointsService } from "../points-engine/services/points.service";
import dayjs from "dayjs";

export interface PaginationDto {
    page: number;
    pageSize: number;
}

export interface TeamMember {
    partnerId: string;
    uid: string;
    partnerCode: string;
    currentStar: string;
    joinTime: Date;
    sourceChannelId: string | null;
    children?: TeamMember[]; // 用于树状结构
}

export interface MemberList {
    items: TeamMember[];
    total: number; // 一级下线总数
    totalL1: number; // 一级下线总数（与total相同，为了语义清晰）
    totalL2: number; // 二级下线总数
    page: number;
    pageSize: number;
}

export interface TeamOverview {
    totalL1: number;
    totalL2: number;
}

@Injectable()
export class StatisticsService {
    private readonly logger = new Logger(StatisticsService.name);

    constructor(
        @InjectRepository(PartnerProfileEntity)
        private readonly profileRepository: Repository<PartnerProfileEntity>,
        @InjectRepository(PartnerHierarchyEntity)
        private readonly hierarchyRepository: Repository<PartnerHierarchyEntity>,
        @InjectRepository(PartnerChannelEntity)
        private readonly channelRepository: Repository<PartnerChannelEntity>,
        @InjectRepository(TaskCompletionLogEntity)
        private readonly taskLogRepository: Repository<TaskCompletionLogEntity>,
        private readonly pointsService: PointsService,
    ) {}

    /**
     * 获取团队成员列表
     * @param partnerId 合伙人ID
     * @param depth 深度（1=一级，2=树状结构包含二级）
     * @param pagination 分页参数
     */
    async getTeamMembers(partnerId: string, depth: 1 | 2, pagination: PaginationDto): Promise<MemberList> {
        const { page, pageSize } = pagination;
        const skip = (page - 1) * pageSize;

        this.logger.log(`查询团队成员: partnerId=${partnerId}, depth=${depth}, page=${page}, pageSize=${pageSize}`);

        // 查询一级下线
        const [hierarchyRecords, total] = await this.hierarchyRepository.findAndCount({
            where: {
                parentPartnerId: partnerId,
                level: 1,
                isActive: true,
            },
            skip,
            take: pageSize,
            order: {
                bindTime: "DESC",
            },
        });

        // 获取所有一级下线的详细信息
        const childPartnerIds = hierarchyRecords.map((h) => h.childPartnerId);

        let profiles: PartnerProfileEntity[] = [];
        if (childPartnerIds.length > 0) {
            profiles = await this.profileRepository
                .createQueryBuilder("profile")
                .where("profile.partner_id IN (:...ids)", { ids: childPartnerIds })
                .getMany();
        }

        // 创建一个映射以便快速查找
        const profileMap = new Map<string, PartnerProfileEntity>();
        profiles.forEach((profile) => {
            profileMap.set(profile.partnerId, profile);
        });

        // 组合一级数据
        const items: TeamMember[] = hierarchyRecords.map((hierarchy) => {
            const profile = profileMap.get(hierarchy.childPartnerId);

            return {
                partnerId: hierarchy.childPartnerId,
                uid: profile?.uid || "",
                partnerCode: profile?.partnerCode || "",
                currentStar: profile?.currentStar || "",
                joinTime: profile?.joinTime || new Date(),
                sourceChannelId: hierarchy.sourceChannelId,
            };
        });

        // 如果depth=2，加载每个一级下线的二级下线
        if (depth === 2 && childPartnerIds.length > 0) {
            for (const item of items) {
                const l2Members = await this.getDirectChildren(item.partnerId);
                if (l2Members.length > 0) {
                    item.children = l2Members;
                }
            }
        }

        // 计算二级下线总数
        const totalL2 = await this.hierarchyRepository.count({
            where: {
                parentPartnerId: partnerId,
                level: 2,
                isActive: true,
            },
        });

        this.logger.log(`查询团队成员完成: totalL1=${total}, totalL2=${totalL2}, returned=${items.length}`);

        return {
            items,
            total, // 一级下线总数（保持向后兼容）
            totalL1: total, // 一级下线总数
            totalL2, // 二级下线总数
            page,
            pageSize,
        };
    }

    /**
     * 获取直接下线（不分页，有上限）
     * @param partnerId 合伙人ID
     * @param limit 最大返回数量，默认100
     */
    private async getDirectChildren(partnerId: string, limit = 100): Promise<TeamMember[]> {
        // 查询直接下线，限制最大数量
        const hierarchyRecords = await this.hierarchyRepository.find({
            where: {
                parentPartnerId: partnerId,
                level: 1,
                isActive: true,
            },
            order: {
                bindTime: "DESC",
            },
            take: limit, // 限制最大返回数量
        });

        if (hierarchyRecords.length === 0) {
            return [];
        }

        // 获取详细信息
        const childPartnerIds = hierarchyRecords.map((h) => h.childPartnerId);
        const profiles = await this.profileRepository
            .createQueryBuilder("profile")
            .where("profile.partner_id IN (:...ids)", { ids: childPartnerIds })
            .getMany();

        const profileMap = new Map<string, PartnerProfileEntity>();
        profiles.forEach((profile) => {
            profileMap.set(profile.partnerId, profile);
        });

        return hierarchyRecords.map((hierarchy) => {
            const profile = profileMap.get(hierarchy.childPartnerId);
            return {
                partnerId: hierarchy.childPartnerId,
                uid: profile?.uid || "",
                partnerCode: profile?.partnerCode || "",
                currentStar: profile?.currentStar || "",
                joinTime: profile?.joinTime || new Date(),
                sourceChannelId: hierarchy.sourceChannelId,
            };
        });
    }

    /**
     * 获取团队概览统计（实时计算）
     * @param partnerId 合伙人ID
     */
    async getTeamOverview(partnerId: string): Promise<TeamOverview> {
        this.logger.log(`获取团队概览统计: partnerId=${partnerId}`);

        // 实时SQL聚合计算一级下线总数
        const totalL1 = await this.hierarchyRepository.count({
            where: {
                parentPartnerId: partnerId,
                level: 1,
                isActive: true,
            },
        });

        // 实时SQL聚合计算二级下线总数
        const totalL2 = await this.hierarchyRepository.count({
            where: {
                parentPartnerId: partnerId,
                level: 2,
                isActive: true,
            },
        });

        this.logger.log(`团队概览统计完成: totalL1=${totalL1}, totalL2=${totalL2}`);

        return {
            totalL1,
            totalL2,
        };
    }

    /**
     * 验证目标合伙人是否是当前合伙人的下线（一级或二级）
     * @param currentPartnerId 当前合伙人ID
     * @param targetPartnerId 目标合伙人ID
     * @returns 是否是下线关系
     */
    async isDownline(currentPartnerId: string, targetPartnerId: string): Promise<boolean> {
        this.logger.log(`验证下线关系: current=${currentPartnerId}, target=${targetPartnerId}`);

        // 查询是否存在层级关系（一级或二级）
        const hierarchy = await this.hierarchyRepository.findOne({
            where: {
                parentPartnerId: currentPartnerId,
                childPartnerId: targetPartnerId,
                isActive: true,
            },
        });

        const isDownline = !!hierarchy;
        this.logger.log(`下线关系验证结果: ${isDownline}`);

        return isDownline;
    }

    /**
     * 获取管理后台总览数据
     */
    async getDashboard() {
        this.logger.log("获取管理后台总览数据");

        // 1. 合伙人总数
        const totalPartners = await this.profileRepository.count();

        // 2. 活跃合伙人数（30天内有任务完成记录）
        const thirtyDaysAgo = dayjs().subtract(30, "days").toDate();
        const activePartnerIds = await this.taskLogRepository
            .createQueryBuilder("log")
            .select("DISTINCT log.partner_id", "partnerId")
            .where("log.created_at >= :thirtyDaysAgo", { thirtyDaysAgo })
            .getRawMany();
        const activePartners = activePartnerIds.length;

        // 3. 本月新增合伙人
        const startOfMonth = dayjs().startOf("month").toDate();
        const newPartnersThisMonth = await this.profileRepository.count({
            where: {
                joinTime: MoreThanOrEqual(startOfMonth),
            },
        });

        // 4. 冻结数量
        const frozenPartners = await this.profileRepository.count({
            where: {
                status: "frozen",
            },
        });

        // 5. 增长率（本月新增 / 上月总数）
        const startOfLastMonth = dayjs().subtract(1, "month").startOf("month").toDate();
        const endOfLastMonth = dayjs().subtract(1, "month").endOf("month").toDate();
        const lastMonthTotal = await this.profileRepository.count({
            where: {
                joinTime: MoreThanOrEqual(startOfLastMonth),
            },
        });
        const growthRate = lastMonthTotal > 0 ? (newPartnersThisMonth / lastMonthTotal) * 100 : 0;

        // 6. 总发放积分（所有任务日志的积分总和）
        const allLogs = await this.taskLogRepository.find();
        let totalIssued = 0;
        for (const log of allLogs) {
            const points = await this.pointsService["calculateLogPoints"](log);
            totalIssued += points;
        }

        // 7. 本月发放积分
        const monthLogs = await this.taskLogRepository.find({
            where: {
                createdAt: MoreThanOrEqual(startOfMonth),
            },
        });
        let issuedThisMonth = 0;
        for (const log of monthLogs) {
            const points = await this.pointsService["calculateLogPoints"](log);
            issuedThisMonth += points;
        }

        // 8. 平均积分
        const averagePoints = totalPartners > 0 ? Math.floor(totalIssued / totalPartners) : 0;

        // 9. 积分排行 TOP 10
        const allPartners = await this.profileRepository.find();
        const partnerPoints = await Promise.all(
            allPartners.map(async (partner) => {
                const points = await this.pointsService.getUserPoints(partner.partnerId);
                return {
                    partnerId: partner.partnerId,
                    partnerCode: partner.partnerCode,
                    points,
                };
            }),
        );
        const topEarners = partnerPoints.sort((a, b) => b.points - a.points).slice(0, 10);

        // 10. 团队统计
        const totalL1 = await this.hierarchyRepository.count({
            where: { level: 1, isActive: true },
        });
        const totalL2 = await this.hierarchyRepository.count({
            where: { level: 2, isActive: true },
        });
        const averageTeamSize = totalPartners > 0 ? (totalL1 / totalPartners).toFixed(1) : "0";

        // 11. 趋势数据（最近30天）
        const partnerGrowth = [];
        const pointsIssuance = [];
        for (let i = 29; i >= 0; i--) {
            const date = dayjs().subtract(i, "days").format("YYYY-MM-DD");
            const startOfDay = dayjs().subtract(i, "days").startOf("day").toDate();
            const endOfDay = dayjs().subtract(i, "days").endOf("day").toDate();

            // 当天新增合伙人数
            const count = await this.profileRepository.count({
                where: {
                    joinTime: MoreThanOrEqual(startOfDay),
                },
            });
            partnerGrowth.push({ date, count });

            // 当天发放积分
            const dayLogs = await this.taskLogRepository.find({
                where: {
                    createdAt: MoreThanOrEqual(startOfDay),
                },
            });
            let dayPoints = 0;
            for (const log of dayLogs) {
                const points = await this.pointsService["calculateLogPoints"](log);
                dayPoints += points;
            }
            pointsIssuance.push({ date, points: dayPoints.toString() });
        }

        return {
            overview: {
                totalPartners,
                activePartners,
                newPartnersThisMonth,
                frozenPartners,
                growthRate: parseFloat(growthRate.toFixed(2)),
            },
            points: {
                totalIssued: totalIssued.toString(),
                issuedThisMonth: issuedThisMonth.toString(),
                averagePoints: averagePoints.toString(),
                topEarners,
            },
            team: {
                totalL1,
                totalL2,
                averageTeamSize: parseFloat(averageTeamSize),
            },
            trends: {
                partnerGrowth,
                pointsIssuance,
            },
        };
    }

    /**
     * 获取合伙人的积分明细
     */
    async getPartnerPoints(partnerId: string, page = 1, pageSize = 20) {
        this.logger.log(`获取合伙人积分明细: partnerId=${partnerId}, page=${page}, pageSize=${pageSize}`);

        const skip = (page - 1) * pageSize;

        // 查询任务日志
        const [logs, total] = await this.taskLogRepository.findAndCount({
            where: {
                partnerId,
            },
            order: {
                createdAt: "DESC",
            },
            skip,
            take: pageSize,
        });

        // 计算每条日志的积分
        const transactions = await Promise.all(
            logs.map(async (log) => {
                const points = await this.pointsService["calculateLogPoints"](log);
                return {
                    id: log.id,
                    taskCode: log.taskCode,
                    taskType: log.taskType,
                    points,
                    businessParams: log.businessParams,
                    createdAt: log.createdAt,
                };
            }),
        );

        // 获取总积分
        const totalPoints = await this.pointsService.getUserPoints(partnerId);

        return {
            totalPoints: totalPoints.toString(),
            transactions,
            pagination: {
                current: page,
                pageSize,
                total,
            },
        };
    }

    /**
     * 获取团队高级统计
     * @param partnerId 合伙人ID
     * @description 统计的是"我"的数据，不是团队成员的总和
     */
    async getTeamAdvancedStatistics(partnerId: string): Promise<{
        totalMembers: number;
        activeMembers30Days: number;
        effectiveMembers: number;
        thisMonthMira: string;
        thisMonthRecharge: string;
    }> {
        this.logger.log(`获取团队高级统计: partnerId=${partnerId}`);

        // 1. 获取一级下线总数
        const downlineCount = await this.hierarchyRepository.count({
            where: {
                parentPartnerId: partnerId,
                level: 1,
                isActive: true,
            },
        });

        // 总成员数 = 自己 + 一级下线
        const totalMembers = downlineCount + 1;

        // 2. 统计30天内活跃的贡献者数量（为我贡献过积分的人）
        const thirtyDaysAgo = dayjs().subtract(30, "days").toDate();

        // 查询30天内我的任务日志，统计不同的贡献者
        const activeLogs = await this.taskLogRepository.find({
            where: {
                partnerId,
                createdAt: MoreThanOrEqual(thirtyDaysAgo),
            },
        });

        // 统计不同的贡献者（包括自己）
        const activeContributors = new Set<string>();
        activeLogs.forEach((log) => {
            if (log.relatedPartnerId) {
                activeContributors.add(log.relatedPartnerId);
            } else {
                activeContributors.add("self"); // 自己的贡献
            }
        });

        const activeMembers30Days = activeContributors.size;

        // 3. 统计有效成员（所有为我贡献过积分的人）
        const allLogs = await this.taskLogRepository.find({
            where: {
                partnerId,
            },
        });

        const effectiveContributors = new Set<string>();
        allLogs.forEach((log) => {
            if (log.relatedPartnerId) {
                effectiveContributors.add(log.relatedPartnerId);
            } else {
                effectiveContributors.add("self");
            }
        });

        const effectiveMembers = effectiveContributors.size;

        // 4. 统计本月我获得的积分（来自所有贡献者）
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 查询本月我的任务完成记录
        const monthlyLogs = await this.taskLogRepository.find({
            where: {
                partnerId,
                createdAt: MoreThanOrEqual(firstDayOfMonth),
            },
        });

        let thisMonthMira = 0;
        // 计算本月我获得的积分总和
        for (const log of monthlyLogs) {
            const points = await this.pointsService["calculateLogPoints"](log);
            if (points > 0) {
                thisMonthMira += points;
            }
        }

        // 本月充值总额（暂时返回0，需要订单系统支持）
        const thisMonthRecharge = "0";

        this.logger.log(
            `团队高级统计完成: totalMembers=${totalMembers}(1+${downlineCount}), activeMembers30Days=${activeMembers30Days}, effectiveMembers=${effectiveMembers}, thisMonthMira=${thisMonthMira}`,
        );

        return {
            totalMembers,
            activeMembers30Days,
            effectiveMembers,
            thisMonthMira: thisMonthMira.toString(),
            thisMonthRecharge,
        };
    }

    /**
     * 获取团队成员列表（含统计信息）
     * @param partnerId 合伙人ID
     * @param pagination 分页参数
     * @description 统计每个成员对我的积分贡献（不是成员自己的积分）
     */
    async getTeamMembersWithStats(
        partnerId: string,
        pagination: PaginationDto,
    ): Promise<{
        items: Array<{
            partnerId: string;
            uid: string;
            partnerCode: string;
            currentStar: string;
            joinTime: Date;
            lastActiveTime: Date | null;
            cumulativeMira: string;
            thisMonthMira: string;
            isSelf?: boolean;
        }>;
        total: number;
        page: number;
        pageSize: number;
    }> {
        const { page, pageSize } = pagination;

        this.logger.log(`查询团队成员积分贡献: partnerId=${partnerId}, page=${page}, pageSize=${pageSize}`);

        // 1. 查询我的所有任务日志，按 relatedPartnerId 分组统计贡献者
        const contributionQuery = `
            SELECT 
                COALESCE(related_partner_id, 'self') as contributor_id,
                COUNT(*) as task_count
            FROM biz_task_completion_log
            WHERE partner_id = ?
              AND status = 'completed'
            GROUP BY COALESCE(related_partner_id, 'self')
        `;

        const contributionStats = await this.taskLogRepository.manager.query(contributionQuery, [partnerId]);

        // 2. 获取所有贡献者ID（排除self）
        const contributorIds = contributionStats
            .map((stat: any) => stat.contributor_id)
            .filter((id: string) => id !== "self");

        // 3. 查询贡献者的档案信息
        let contributorProfiles: PartnerProfileEntity[] = [];
        if (contributorIds.length > 0) {
            contributorProfiles = await this.profileRepository
                .createQueryBuilder("profile")
                .where("profile.partner_id IN (:...ids)", { ids: contributorIds })
                .getMany();
        }

        const profileMap = new Map<string, PartnerProfileEntity>();
        contributorProfiles.forEach((profile) => {
            profileMap.set(profile.partnerId, profile);
        });

        // 4. 计算每个贡献者的积分贡献
        const allContributors = await Promise.all(
            contributionStats.map(async (stat: any) => {
                const contributorId = stat.contributor_id;
                const isSelf = contributorId === "self";

                // 查询该贡献者为我贡献的所有任务日志
                const logs = await this.taskLogRepository.find({
                    where: {
                        partnerId, // 我的ID
                        relatedPartnerId: isSelf ? null : contributorId,
                    },
                });

                // 计算累计贡献
                let cumulativeContribution = 0;
                for (const log of logs) {
                    const points = await this.pointsService["calculateLogPoints"](log);
                    if (points > 0) {
                        cumulativeContribution += points;
                    }
                }

                // 计算本月贡献
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthlyLogs = logs.filter((log) => log.createdAt >= firstDayOfMonth);

                let thisMonthContribution = 0;
                for (const log of monthlyLogs) {
                    const points = await this.pointsService["calculateLogPoints"](log);
                    if (points > 0) {
                        thisMonthContribution += points;
                    }
                }

                // 查询最后活跃时间（最后一次为我贡献积分的时间）
                const lastLog =
                    logs.length > 0 ? logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] : null;

                if (isSelf) {
                    // 自己的贡献
                    const selfProfile = await this.profileRepository.findOne({
                        where: { partnerId },
                    });

                    return {
                        partnerId: selfProfile?.partnerId || partnerId,
                        uid: selfProfile?.uid || "",
                        partnerCode: selfProfile?.partnerCode || "",
                        currentStar: selfProfile?.currentStar || "",
                        joinTime: selfProfile?.joinTime || new Date(),
                        lastActiveTime: lastLog?.createdAt || null,
                        cumulativeMira: cumulativeContribution.toString(),
                        thisMonthMira: thisMonthContribution.toString(),
                        isSelf: true,
                        _sortKey: cumulativeContribution, // 用于排序
                    };
                } else {
                    // 下线的贡献
                    const profile = profileMap.get(contributorId);

                    return {
                        partnerId: contributorId,
                        uid: profile?.uid || "",
                        partnerCode: profile?.partnerCode || "",
                        currentStar: profile?.currentStar || "",
                        joinTime: profile?.joinTime || new Date(),
                        lastActiveTime: lastLog?.createdAt || null,
                        cumulativeMira: cumulativeContribution.toString(),
                        thisMonthMira: thisMonthContribution.toString(),
                        isSelf: false,
                        _sortKey: cumulativeContribution,
                    };
                }
            }),
        );

        // 5. 按累计贡献排序（降序）
        allContributors.sort((a, b) => b._sortKey - a._sortKey);

        // 6. 分页
        const total = allContributors.length;
        const skip = (page - 1) * pageSize;
        const items = allContributors.slice(skip, skip + pageSize).map((item) => {
            const { _sortKey, ...rest } = item;
            return rest;
        });

        this.logger.log(`查询团队成员积分贡献完成: total=${total}, returned=${items.length}`);

        return {
            items,
            total,
            page,
            pageSize,
        };
    }

    /**
     * 获取合伙人的任务日志
     */
    async getPartnerTaskLogs(partnerId: string, page = 1, pageSize = 20) {
        this.logger.log(`获取合伙人任务日志: partnerId=${partnerId}, page=${page}, pageSize=${pageSize}`);

        const skip = (page - 1) * pageSize;

        // 查询任务日志
        const [logs, total] = await this.taskLogRepository.findAndCount({
            where: {
                partnerId,
            },
            order: {
                createdAt: "DESC",
            },
            skip,
            take: pageSize,
        });

        // 计算每条日志的积分
        const items = await Promise.all(
            logs.map(async (log) => {
                const points = await this.pointsService["calculateLogPoints"](log);
                return {
                    id: log.id,
                    taskCode: log.taskCode,
                    taskType: log.taskType,
                    points,
                    status: log.status,
                    relatedPartnerId: log.relatedPartnerId,
                    relatedUid: log.relatedUid,
                    businessParams: log.businessParams,
                    createdAt: log.createdAt,
                };
            }),
        );

        return {
            items,
            pagination: {
                current: page,
                pageSize,
                total,
            },
        };
    }
}

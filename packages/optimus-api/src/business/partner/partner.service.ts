import { Injectable, Logger, BadRequestException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PartnerProfileEntity } from "./entities/partner-profile.entity";
import { PartnerChannelEntity } from "./entities/partner-channel.entity";
import { AdminOperationLogEntity } from "./entities/admin-operation-log.entity";
import { TaskCompletionLogEntity } from "../points-engine/entities/task-completion-log.entity";
import { PartnerStatus } from "./enums/partner-status.enum";
import { StarLevel } from "./enums/star-level.enum";
import { ChannelStatus } from "./enums/channel-status.enum";
import { JoinPartnerDto } from "./dto/join-partner.dto";
import { QueryPartnersDto } from "./dto/query-partners.dto";
import {
    InvalidInviterException,
    InvalidChannelException,
    DuplicateUserIdException,
    InvalidPartnerIdException,
    UplinkImmutableException,
    DuplicateTeamNameException,
    TeamNameImmutableException,
} from "./exceptions/partner.exception";
import { HierarchyService } from "./hierarchy.service";
import { PartnerEventType, RegisterSelfEventPayload, RegisterDownlineL1EventPayload } from "./events/partner-event.dto";
import { PointsCacheService } from "../points-engine/services/points-cache.service";
import { PointsService } from "../points-engine/services/points.service";
// ValidationService removed - game-specific sensitive word checking

@Injectable()
export class PartnerService {
    private readonly logger = new Logger(PartnerService.name);

    constructor(
        @InjectRepository(PartnerProfileEntity)
        private readonly partnerProfileRepository: Repository<PartnerProfileEntity>,
        @InjectRepository(PartnerChannelEntity)
        private readonly partnerChannelRepository: Repository<PartnerChannelEntity>,
        @InjectRepository(AdminOperationLogEntity)
        private readonly adminLogRepository: Repository<AdminOperationLogEntity>,
        @InjectRepository(TaskCompletionLogEntity)
        private readonly taskLogRepository: Repository<TaskCompletionLogEntity>,
        private readonly hierarchyService: HierarchyService,
        private readonly eventEmitter: EventEmitter2,
        private readonly pointsCacheService: PointsCacheService,
        @Inject(forwardRef(() => PointsService))
        private readonly pointsService: PointsService,
    ) {}

    /**
     * 生成唯一的合伙人编号（LP+数字格式）
     */
    async generatePartnerCode(): Promise<string> {
        const maxRetries = 10;

        for (let i = 0; i < maxRetries; i++) {
            // 生成6位随机数字
            const randomNum = Math.floor(100000 + Math.random() * 900000);
            const code = `LP${randomNum}`;

            // 检查是否已存在
            const existing = await this.partnerProfileRepository.findOne({
                where: { partnerCode: code },
            });

            if (!existing) {
                return code;
            }
        }

        // 如果10次都失败，使用时间戳确保唯一性
        const timestamp = Date.now().toString().slice(-6);
        return `LP${timestamp}`;
    }

    /**
     * 通过userId查询合伙人档案（新方法，支持通用用户系统）
     */
    async getProfileByUserId(userId: string): Promise<PartnerProfileEntity | null> {
        return this.partnerProfileRepository.findOne({
            where: { userId },
        });
    }

    /**
     * 通过uid查询合伙人档案（向后兼容，逐步废弃）
     */
    async getProfileByUid(uid: string): Promise<PartnerProfileEntity | null> {
        return this.partnerProfileRepository.findOne({
            where: { uid },
        });
    }

    /**
     * 通过合伙人编号查询档案
     */
    async getProfileByCode(partnerCode: string): Promise<PartnerProfileEntity | null> {
        return this.partnerProfileRepository.findOne({
            where: { partnerCode },
        });
    }

    /**
     * 创建合伙人档案（支持userId）
     */
    async createProfile(
        userIdOrUid: string,
        partnerCode: string,
        teamName?: string,
        username?: string,
    ): Promise<PartnerProfileEntity> {
        // 检查userId是否已存在
        let existing = await this.getProfileByUserId(userIdOrUid);
        if (!existing) {
            // 也检查uid（向后兼容）
            existing = await this.getProfileByUid(userIdOrUid);
        }

        if (existing) {
            throw new DuplicateUserIdException(userIdOrUid);
        }

        const profile = this.partnerProfileRepository.create({
            userId: userIdOrUid, // 新字段
            uid: userIdOrUid, // 保留旧字段以兼容
            username: username || null,
            partnerCode,
            status: PartnerStatus.ACTIVE,
            currentStar: StarLevel.NEW,
            totalMira: "0",
            teamName: teamName || null,
            extraData: null,
        });

        return this.partnerProfileRepository.save(profile);
    }

    /**
     * 验证邀请人是否有效
     */
    async validateInviter(inviterCode: string): Promise<PartnerProfileEntity> {
        const inviter = await this.getProfileByCode(inviterCode);

        if (!inviter || inviter.status !== PartnerStatus.ACTIVE) {
            throw new InvalidInviterException(inviterCode);
        }

        return inviter;
    }

    /**
     * 验证渠道是否有效
     */
    async validateChannel(inviterPartnerId: string, channelCode: string): Promise<PartnerChannelEntity> {
        const channel = await this.partnerChannelRepository.findOne({
            where: {
                partnerId: inviterPartnerId,
                channelCode,
            },
        });

        if (!channel) {
            throw new InvalidChannelException(channelCode);
        }

        if (channel.status !== ChannelStatus.ACTIVE) {
            throw new InvalidChannelException(channelCode);
        }

        return channel;
    }

    /**
     * 用户加入合伙人计划（支持userId）
     */
    async joinPartner(userIdOrUid: string, dto: JoinPartnerDto): Promise<PartnerProfileEntity> {
        // 尝试通过userId查询（新系统）
        let existingProfile = await this.getProfileByUserId(userIdOrUid);

        // 如果没找到，尝试通过uid查询（向后兼容）
        if (!existingProfile) {
            existingProfile = await this.getProfileByUid(userIdOrUid);
        }

        // 检查是否已注册（幂等性）
        if (existingProfile) {
            this.logger.log(`用户 ${userIdOrUid} 已是合伙人，返回现有档案`);

            // 如果已存在且传入了上级信息，检查是否需要设置上级
            if (dto.inviterCode) {
                const uplink = await this.hierarchyService.getUplink(existingProfile.partnerId);
                if (!uplink) {
                    // 没有上级，可以设置（但不触发注册任务，因为用户已经是合伙人）
                    this.logger.log(`为已存在的合伙人 ${userIdOrUid} 设置上级: ${dto.inviterCode}（不触发注册任务）`);
                    const inviter = await this.validateInviter(dto.inviterCode);

                    let channelId: string | undefined;
                    if (dto.channelCode) {
                        const channel = await this.validateChannel(inviter.partnerId, dto.channelCode);
                        channelId = channel.id;
                    }

                    await this.hierarchyService.createRelationship(
                        inviter.partnerId,
                        existingProfile.partnerId,
                        channelId,
                    );
                    // 注意：这里只发布下线注册事件（邀请人获得积分），不发布 register_self 事件
                    await this.publishRegisterDownlineL1Event(
                        inviter,
                        existingProfile,
                        channelId,
                        dto.userRegisterTime,
                    );
                } else {
                    this.logger.log(`合伙人 ${userIdOrUid} 已有上级，忽略上级设置`);
                }
            }

            return existingProfile;
        }

        // 如果提供了团队名称，进行敏感词校验
        if (dto.teamName) {
            await this.validateTeamName(dto.teamName);
        }

        // 生成合伙人编号
        const partnerCode = await this.generatePartnerCode();

        // 创建合伙人档案（使用userIdOrUid作为userId）
        const profile = await this.createProfile(userIdOrUid, partnerCode, dto.teamName, dto.username);

        // 发布register_self事件（使用用户实际注册时间）
        await this.publishRegisterSelfEvent(profile, dto.userRegisterTime);

        // 如果提供了邀请人信息，建立层级关系
        if (dto.inviterCode) {
            this.logger.log(`用户 ${userIdOrUid} 加入合伙人计划，邀请人: ${dto.inviterCode}`);

            // 验证邀请人
            const inviter = await this.validateInviter(dto.inviterCode);

            // 如果提供了渠道码，验证渠道并获取渠道ID
            let channelId: string | undefined;
            if (dto.channelCode) {
                const channel = await this.validateChannel(inviter.partnerId, dto.channelCode);
                channelId = channel.id;
            }

            // 创建层级关系
            await this.hierarchyService.createRelationship(inviter.partnerId, profile.partnerId, channelId);

            // 发布下线注册事件（邀请人获得邀请任务积分）
            await this.publishRegisterDownlineL1Event(inviter, profile, channelId, dto.userRegisterTime);
        } else {
            this.logger.log(`用户 ${userIdOrUid} 以自建团队模式加入合伙人计划`);
        }

        this.logger.log(`用户 ${userIdOrUid} 加入成功，合伙人编号: ${profile.partnerCode}`);
        return profile;
    }

    /**
     * 发布register_self事件
     */
    private async publishRegisterSelfEvent(profile: PartnerProfileEntity, userRegisterTime: number): Promise<void> {
        const payload: RegisterSelfEventPayload = {
            eventType: PartnerEventType.REGISTER_SELF,
            partnerId: profile.partnerId,
            partnerCode: profile.partnerCode,
            uid: profile.uid,
            timestamp: userRegisterTime, // 使用用户实际注册时间
        };

        this.eventEmitter.emit("partner.register_self", payload);
        this.logger.log(`发布事件: partner.register_self for partnerId=${profile.partnerId}`);
    }

    /**
     * 发布register_downline_L1事件
     */
    private async publishRegisterDownlineL1Event(
        inviter: PartnerProfileEntity,
        downline: PartnerProfileEntity,
        sourceChannelId: string | undefined,
        userRegisterTime: number,
    ): Promise<void> {
        const payload: RegisterDownlineL1EventPayload = {
            eventType: PartnerEventType.REGISTER_DOWNLINE_L1,
            partnerId: inviter.partnerId,
            partnerCode: inviter.partnerCode,
            uid: inviter.uid,
            downlinePartnerId: downline.partnerId,
            downlinePartnerCode: downline.partnerCode,
            downlineUid: downline.uid,
            sourceChannelId,
            timestamp: userRegisterTime, // 使用用户实际注册时间
        };

        this.eventEmitter.emit("partner.register_downline_L1", payload);
        this.logger.log(
            `发布事件: partner.register_downline_L1 for partnerId=${inviter.partnerId}, downlinePartnerId=${downline.partnerId}`,
        );
    }

    /**
     * 查询合伙人列表（管理后台）
     */
    async queryPartners(dto: QueryPartnersDto): Promise<{ items: any[]; total: number }> {
        const { partnerCode, status, page, pageSize } = dto;
        const skip = (page - 1) * pageSize;

        const where: any = {};
        if (partnerCode) {
            where.partnerCode = Like(`%${partnerCode}%`);
        }
        if (status) {
            where.status = status;
        }

        const [items, total] = await this.partnerProfileRepository.findAndCount({
            where,
            skip,
            take: pageSize,
            order: {
                joinTime: "DESC",
            },
        });

        // 为每个合伙人添加上级信息和下线数量
        const enrichedItems = await Promise.all(
            items.map(async (profile) => {
                // 查询上级信息
                const uplink = await this.hierarchyService.getUplink(profile.partnerId);
                let uplinkPartnerCode = null;

                if (uplink) {
                    const uplinkProfile = await this.partnerProfileRepository.findOne({
                        where: { partnerId: uplink.parentPartnerId },
                    });
                    uplinkPartnerCode = uplinkProfile?.partnerCode || null;
                }

                // 查询下线数量
                const overview = await this.hierarchyService.getDownlines(profile.partnerId, 1, {
                    page: 1,
                    pageSize: 1,
                });
                const totalL1 = overview.total;

                const l2Count = await this.partnerProfileRepository.manager.query(
                    `SELECT COUNT(*) as count FROM biz_partner_hierarchy WHERE parent_partner_id = ? AND level = 2 AND is_active = 1`,
                    [profile.partnerId],
                );
                const totalL2 = parseInt(l2Count[0]?.count || "0", 10);

                return {
                    ...profile,
                    uplinkPartnerCode,
                    totalL1,
                    totalL2,
                };
            }),
        );

        this.logger.log(`查询合伙人列表: total=${total}, page=${page}`);
        return { items: enrichedItems, total };
    }

    /**
     * 通过partnerId获取档案
     */
    async getProfileById(partnerId: string): Promise<PartnerProfileEntity> {
        const profile = await this.partnerProfileRepository.findOne({
            where: { partnerId },
        });

        if (!profile) {
            throw new InvalidPartnerIdException(Number(partnerId));
        }

        return profile;
    }

    /**
     * 通过partnerId获取档案（包含上级信息）
     */
    async getProfileByIdWithUplink(partnerId: string): Promise<any> {
        const profile = await this.getProfileById(partnerId);

        // 实时计算个人总积分（通过积分引擎）
        const realTimeTotalMira = await this.pointsService.getUserPoints(partnerId);

        // 查询上级关系
        const uplink = await this.hierarchyService.getUplink(partnerId);

        // 查询下线数量
        const overview = await this.hierarchyService.getDownlines(partnerId, 1, {
            page: 1,
            pageSize: 1,
        });
        const totalL1 = overview.total;

        const l2Count = await this.partnerProfileRepository.manager.query(
            `SELECT COUNT(*) as count FROM biz_partner_hierarchy WHERE parent_partner_id = ? AND level = 2 AND is_active = 1`,
            [partnerId],
        );
        const totalL2 = parseInt(l2Count[0]?.count || "0", 10);

        if (!uplink) {
            // 没有上级，返回档案信息（使用实时积分）
            return {
                ...profile,
                totalMira: realTimeTotalMira.toString(),
                totalL1,
                totalL2,
            };
        }

        // 查询上级的档案信息
        const uplinkProfile = await this.partnerProfileRepository.findOne({
            where: { partnerId: uplink.parentPartnerId },
        });

        return {
            ...profile,
            totalMira: realTimeTotalMira.toString(),
            totalL1,
            totalL2,
            uplink: uplinkProfile
                ? {
                      partnerId: uplinkProfile.partnerId,
                      partnerCode: uplinkProfile.partnerCode,
                      uid: uplinkProfile.uid,
                  }
                : null,
        };
    }

    /**
     * 通过userId获取档案（包含上级信息）- 新方法
     */
    async getProfileWithUplinkByUserId(userId: string): Promise<any> {
        const profile = await this.getProfileByUserId(userId);

        if (!profile) {
            return null;
        }

        // 实时计算个人总积分（通过积分引擎）
        const realTimeTotalMira = await this.pointsService.getUserPoints(profile.partnerId);

        // 获取本月积分（带缓存）
        const thisMonthMira = await this.pointsService.getUserMonthlyPoints(profile.partnerId);

        // 查询上级关系
        const uplink = await this.hierarchyService.getUplink(profile.partnerId);

        if (!uplink) {
            // 没有上级，返回档案信息（使用实时积分）
            return {
                ...profile,
                totalMira: realTimeTotalMira.toString(),
                thisMonthMira: thisMonthMira.toString(),
            };
        }

        // 查询上级的档案信息
        const uplinkProfile = await this.partnerProfileRepository.findOne({
            where: { partnerId: uplink.parentPartnerId },
        });

        return {
            ...profile,
            totalMira: realTimeTotalMira.toString(),
            thisMonthMira: thisMonthMira.toString(),
            uplink: uplinkProfile
                ? {
                      partnerId: uplinkProfile.partnerId,
                      partnerCode: uplinkProfile.partnerCode,
                      uid: uplinkProfile.uid,
                  }
                : null,
        };
    }

    /**
     * 通过uid获取档案（包含上级信息）- 向后兼容
     */
    async getProfileWithUplink(uid: string): Promise<any> {
        const profile = await this.getProfileByUid(uid);

        if (!profile) {
            return null;
        }

        // 实时计算个人总积分（通过积分引擎）
        const realTimeTotalMira = await this.pointsService.getUserPoints(profile.partnerId);

        // 获取本月积分（带缓存）
        const thisMonthMira = await this.pointsService.getUserMonthlyPoints(profile.partnerId);

        // 查询上级关系
        const uplink = await this.hierarchyService.getUplink(profile.partnerId);

        if (!uplink) {
            // 没有上级，返回档案信息（使用实时积分）
            return {
                ...profile,
                totalMira: realTimeTotalMira.toString(),
                thisMonthMira: thisMonthMira.toString(),
            };
        }

        // 查询上级的档案信息
        const uplinkProfile = await this.partnerProfileRepository.findOne({
            where: { partnerId: uplink.parentPartnerId },
        });

        return {
            ...profile,
            totalMira: realTimeTotalMira.toString(),
            thisMonthMira: thisMonthMira.toString(),
            uplink: uplinkProfile
                ? {
                      partnerId: uplinkProfile.partnerId,
                      partnerCode: uplinkProfile.partnerCode,
                      uid: uplinkProfile.uid,
                  }
                : null,
        };
    }

    /**
     * 冻结合伙人
     */
    async freezePartner(partnerId: string, adminId: string, reason: string): Promise<void> {
        const profile = await this.getProfileById(partnerId);

        // 记录操作前数据
        const beforeData = {
            status: profile.status,
        };

        // 更新状态为frozen
        profile.status = PartnerStatus.FROZEN;
        await this.partnerProfileRepository.save(profile);

        // 记录操作后数据
        const afterData = {
            status: profile.status,
        };

        // 记录操作日志
        await this.logAdminOperation(partnerId, "freeze", adminId, reason, beforeData, afterData);

        this.logger.log(`合伙人 ${partnerId} 已被管理员 ${adminId} 冻结，原因: ${reason}`);
    }

    /**
     * 解冻合伙人
     */
    async unfreezePartner(partnerId: string, adminId: string): Promise<void> {
        const profile = await this.getProfileById(partnerId);

        // 记录操作前数据
        const beforeData = {
            status: profile.status,
        };

        // 更新状态为active
        profile.status = PartnerStatus.ACTIVE;
        await this.partnerProfileRepository.save(profile);

        // 记录操作后数据
        const afterData = {
            status: profile.status,
        };

        // 记录操作日志
        await this.logAdminOperation(partnerId, "unfreeze", adminId, null, beforeData, afterData);

        this.logger.log(`合伙人 ${partnerId} 已被管理员 ${adminId} 解冻`);
    }

    /**
     * 更新备注
     */
    async updateRemark(partnerId: string, remark: string, adminId: string): Promise<void> {
        const profile = await this.getProfileById(partnerId);

        // 记录操作前数据
        const beforeData = {
            remark: profile.remark,
        };

        // 更新备注
        profile.remark = remark;
        await this.partnerProfileRepository.save(profile);

        // 记录操作后数据
        const afterData = {
            remark: profile.remark,
        };

        // 记录操作日志
        await this.logAdminOperation(partnerId, "update_remark", adminId, null, beforeData, afterData);

        this.logger.log(`合伙人 ${partnerId} 的备注已被管理员 ${adminId} 更新`);
    }

    /**
     * 更新合伙人的MIRA积分（由积分引擎调用）
     */
    async updateMira(partnerId: string, totalMira: string): Promise<void> {
        const profile = await this.getProfileById(partnerId);

        profile.totalMira = totalMira;
        await this.partnerProfileRepository.save(profile);

        this.logger.log(`合伙人 ${partnerId} 的MIRA积分已更新为: ${totalMira}`);
    }

    /**
     * 更新合伙人的星级（由积分引擎调用）
     */
    async updateStar(partnerId: string, currentStar: string): Promise<void> {
        const profile = await this.getProfileById(partnerId);

        profile.currentStar = currentStar as StarLevel;
        await this.partnerProfileRepository.save(profile);

        this.logger.log(`合伙人 ${partnerId} 的星级已更新为: ${currentStar}`);
    }

    /**
     * 设置上级（支持userId，只能通过 code）
     */
    async setUplink(userIdOrUid: string, inviterCode: string, channelCode?: string): Promise<void> {
        // 尝试通过userId查询
        let profile = await this.getProfileByUserId(userIdOrUid);

        // 如果没找到，尝试通过uid查询（向后兼容）
        if (!profile) {
            profile = await this.getProfileByUid(userIdOrUid);
        }

        if (!profile) {
            throw new BadRequestException(`用户 ${userIdOrUid} 尚未注册为合伙人，请先完成合伙人注册`);
        }

        // 检查是否已有上级
        const existingUplink = await this.hierarchyService.getUplink(profile.partnerId);
        if (existingUplink) {
            throw new UplinkImmutableException(profile.partnerId);
        }

        // 验证邀请人
        const inviter = await this.validateInviter(inviterCode);

        // 如果提供了渠道码，验证渠道并获取渠道ID
        let channelId: string | undefined;
        if (channelCode) {
            const channel = await this.validateChannel(inviter.partnerId, channelCode);
            channelId = channel.id;
        }

        // 创建层级关系
        await this.hierarchyService.createRelationship(inviter.partnerId, profile.partnerId, channelId);

        this.logger.log(`合伙人 ${profile.partnerId} 已设置上级: ${inviter.partnerId}`);
    }

    /**
     * 更新团队名称（支持userId）
     */
    async updateTeamName(userIdOrUid: string, teamName: string): Promise<void> {
        // 尝试通过userId查询
        let profile = await this.getProfileByUserId(userIdOrUid);

        // 如果没找到，尝试通过uid查询（向后兼容）
        if (!profile) {
            profile = await this.getProfileByUid(userIdOrUid);
        }

        if (!profile) {
            throw new BadRequestException(`用户 ${userIdOrUid} 尚未注册为合伙人，请先完成合伙人注册`);
        }

        // 检查是否已有团队名称（不允许修改）
        if (profile.teamName && profile.teamName.trim().length > 0) {
            this.logger.warn(`合伙人 ${profile.partnerId} 尝试修改已存在的团队名称: ${profile.teamName}`);
            throw new TeamNameImmutableException();
        }

        // 敏感词校验 + 重名校验
        await this.validateTeamName(teamName);

        profile.teamName = teamName;
        await this.partnerProfileRepository.save(profile);

        this.logger.log(`合伙人 ${profile.partnerId} 的团队名称已设置为: ${teamName}`);
    }

    /**
     * 验证团队名称（重名校验）
     */
    private async validateTeamName(teamName: string): Promise<void> {
        if (!teamName || teamName.trim().length === 0) {
            return;
        }

        // 重名校验
        const existingProfile = await this.partnerProfileRepository.findOne({
            where: { teamName },
        });

        if (existingProfile) {
            this.logger.warn(`团队名称重复: "${teamName}"`);
            throw new DuplicateTeamNameException(teamName);
        }
    }

    /**
     * 清空单个合伙人数据（危险操作，仅超级管理员可用）
     * @param partnerId 合伙人ID
     * @param adminId 管理员ID
     * @param reason 清空原因
     */
    async clearPartnerData(partnerId: string, adminId: string, reason: string): Promise<void> {
        const profile = await this.getProfileById(partnerId);

        this.logger.warn(`开始清空合伙人数据: partnerId=${partnerId}, adminId=${adminId}, reason=${reason}`);

        // 记录操作前数据（用于审计）
        const beforeData = {
            partnerId: profile.partnerId,
            uid: profile.uid,
            partnerCode: profile.partnerCode,
            status: profile.status,
            totalMira: profile.totalMira,
            currentStar: profile.currentStar,
            teamName: profile.teamName,
        };

        // 使用事务执行清空操作
        await this.partnerProfileRepository.manager.transaction(async (transactionalEntityManager) => {
            // 1. 删除该合伙人的所有层级关系（作为上级）
            await transactionalEntityManager.query(`DELETE FROM biz_partner_hierarchy WHERE parent_partner_id = ?`, [
                partnerId,
            ]);

            // 2. 删除该合伙人的所有层级关系（作为下级）
            await transactionalEntityManager.query(`DELETE FROM biz_partner_hierarchy WHERE child_partner_id = ?`, [
                partnerId,
            ]);

            // 3. 删除该合伙人的所有推广渠道
            await transactionalEntityManager.query(`DELETE FROM biz_partner_channel WHERE partner_id = ?`, [partnerId]);

            // 4. 删除该合伙人的所有任务完成记录
            await transactionalEntityManager.query(`DELETE FROM biz_task_completion_log WHERE partner_id = ?`, [
                partnerId,
            ]);

            // 5. 删除合伙人档案
            await transactionalEntityManager.query(`DELETE FROM biz_partner_profile WHERE partner_id = ?`, [partnerId]);
        });

        // 6. 清除该合伙人的积分缓存
        this.pointsCacheService.invalidateUserCache(partnerId);
        this.logger.log(`已清除合伙人积分缓存: partnerId=${partnerId}`);

        // 记录操作后数据
        const afterData = {
            partnerId: profile.partnerId,
            profileDeleted: true,
            hierarchyCleared: true,
            channelsCleared: true,
            taskLogsCleared: true,
            cacheCleared: true,
        };

        // 记录管理员操作日志
        await this.logAdminOperation(partnerId, "clear_data", adminId, reason, beforeData, afterData);

        this.logger.warn(`合伙人数据清空完成（包括档案）: partnerId=${partnerId}`);
    }

    /**
     * 清空所有合伙人数据（极度危险操作，仅超级管理员可用）
     * @param adminId 管理员ID
     * @param reason 清空原因
     * @param confirmText 确认文本，必须输入 "CLEAR_ALL_PARTNER_DATA" 才能执行
     */
    async clearAllPartnerData(
        adminId: string,
        reason: string,
        confirmText: string,
    ): Promise<{
        clearedProfiles: number;
        clearedHierarchies: number;
        clearedChannels: number;
        clearedTaskLogs: number;
    }> {
        // 二次确认
        if (confirmText !== "CLEAR_ALL_PARTNER_DATA") {
            throw new BadRequestException('确认文本错误，必须输入 "CLEAR_ALL_PARTNER_DATA"');
        }

        this.logger.error(`⚠️ 开始清空所有合伙人数据: adminId=${adminId}, reason=${reason}`);

        // 统计清空前的数据量
        const beforeStats = {
            profiles: await this.partnerProfileRepository.count(),
            hierarchies: await this.partnerProfileRepository.manager.query(
                `SELECT COUNT(*) as count FROM biz_partner_hierarchy`,
            ),
            channels: await this.partnerProfileRepository.manager.query(
                `SELECT COUNT(*) as count FROM biz_partner_channel`,
            ),
            taskLogs: await this.partnerProfileRepository.manager.query(
                `SELECT COUNT(*) as count FROM biz_task_completion_log`,
            ),
        };

        const beforeData = {
            totalProfiles: beforeStats.profiles,
            totalHierarchies: parseInt(beforeStats.hierarchies[0]?.count || "0", 10),
            totalChannels: parseInt(beforeStats.channels[0]?.count || "0", 10),
            totalTaskLogs: parseInt(beforeStats.taskLogs[0]?.count || "0", 10),
            timestamp: new Date().toISOString(),
        };

        this.logger.warn(`清空前统计: ${JSON.stringify(beforeData)}`);

        // 使用事务执行清空操作
        await this.partnerProfileRepository.manager.transaction(async (transactionalEntityManager) => {
            // 1. 删除所有层级关系
            await transactionalEntityManager.query(`DELETE FROM biz_partner_hierarchy`);
            this.logger.warn(`已删除所有层级关系`);

            // 2. 删除所有推广渠道
            await transactionalEntityManager.query(`DELETE FROM biz_partner_channel`);
            this.logger.warn(`已删除所有推广渠道`);

            // 3. 删除所有任务完成记录
            await transactionalEntityManager.query(`DELETE FROM biz_task_completion_log`);
            this.logger.warn(`已删除所有任务完成记录`);

            // 4. 删除所有合伙人档案
            await transactionalEntityManager.query(`DELETE FROM biz_partner_profile`);
            this.logger.warn(`已删除所有合伙人档案`);
        });

        // 5. 清空所有积分缓存
        this.pointsCacheService.clearAll();
        this.logger.warn(`已清空所有积分缓存`);

        const afterData = {
            clearedProfiles: beforeData.totalProfiles,
            clearedHierarchies: beforeData.totalHierarchies,
            clearedChannels: beforeData.totalChannels,
            clearedTaskLogs: beforeData.totalTaskLogs,
            cacheCleared: true,
            timestamp: new Date().toISOString(),
        };

        // 记录管理员操作日志（使用特殊的 partnerId = "0" 表示全局操作）
        await this.logAdminOperation("0", "clear_all_data", adminId, reason, beforeData, afterData);

        this.logger.error(`⚠️ 所有合伙人数据清空完成: ${JSON.stringify(afterData)}`);

        return {
            clearedProfiles: beforeData.totalProfiles,
            clearedHierarchies: beforeData.totalHierarchies,
            clearedChannels: beforeData.totalChannels,
            clearedTaskLogs: beforeData.totalTaskLogs,
        };
    }

    /**
     * 刷新所有积分缓存
     * @param adminId 管理员ID
     */
    async refreshAllCache(adminId: string): Promise<void> {
        this.logger.log(`管理员 ${adminId} 刷新所有积分缓存`);

        // 清空所有积分缓存
        this.pointsCacheService.clearAll();

        // 记录操作日志
        await this.logAdminOperation(
            "0", // 使用特殊的 partnerId = "0" 表示全局操作
            "refresh_cache",
            adminId,
            null,
            { action: "refresh_all_cache" },
            { cacheCleared: true, timestamp: new Date().toISOString() },
        );

        this.logger.log(`积分缓存刷新完成`);
    }

    /**
     * 分析合伙人的邀请任务一致性
     * 检查所有一级下线是否都有对应的邀请任务记录
     */
    async analyzeInviteTasks(partnerId: string): Promise<{
        totalDownlines: number;
        totalInviteTasks: number;
        missingInviteTasks: Array<{
            downlinePartnerId: string;
            downlinePartnerCode: string;
            downlineUid: string;
            joinTime: Date;
        }>;
    }> {
        this.logger.log(`分析邀请任务一致性: partnerId=${partnerId}`);

        // 1. 查询所有一级下线
        const downlines = await this.partnerProfileRepository.manager.query(
            `
            SELECT 
                h.child_partner_id,
                p.partner_code,
                p.uid,
                p.join_time
            FROM biz_partner_hierarchy h
            LEFT JOIN biz_partner_profile p ON h.child_partner_id = p.partner_id
            WHERE h.parent_partner_id = ?
              AND h.level = 1
              AND h.is_active = 1
            ORDER BY h.bind_time ASC
        `,
            [partnerId],
        );

        const totalDownlines = downlines.length;

        // 2. 查询所有邀请任务记录（INVITE_V1）
        const inviteTasks = await this.partnerProfileRepository.manager.query(
            `
            SELECT 
                related_partner_id
            FROM biz_task_completion_log
            WHERE partner_id = ?
              AND task_code = 'INVITE_V1'
              AND status = 'completed'
        `,
            [partnerId],
        );

        const totalInviteTasks = inviteTasks.length;

        // 3. 创建已奖励的下线ID集合
        const rewardedDownlineIds = new Set(inviteTasks.map((task: any) => task.related_partner_id));

        // 4. 找出缺失的邀请任务
        const missingInviteTasks = downlines
            .filter((downline: any) => !rewardedDownlineIds.has(downline.child_partner_id))
            .map((downline: any) => ({
                downlinePartnerId: downline.child_partner_id,
                downlinePartnerCode: downline.partner_code,
                downlineUid: downline.uid,
                joinTime: downline.join_time,
            }));

        this.logger.log(
            `邀请任务分析完成: totalDownlines=${totalDownlines}, totalInviteTasks=${totalInviteTasks}, missing=${missingInviteTasks.length}`,
        );

        return {
            totalDownlines,
            totalInviteTasks,
            missingInviteTasks,
        };
    }

    /**
     * 修复合伙人缺失的邀请任务
     * 为所有缺失的一级下线补充邀请任务记录
     */
    async fixMissingInviteTasks(
        partnerId: string,
        adminId: string,
    ): Promise<{
        fixed: number;
        skipped: number;
        details: Array<{
            downlinePartnerId: string;
            downlinePartnerCode: string;
            status: "fixed" | "skipped";
            reason?: string;
        }>;
    }> {
        this.logger.log(`开始修复邀请任务: partnerId=${partnerId}, adminId=${adminId}`);

        // 1. 分析缺失的邀请任务
        const analysis = await this.analyzeInviteTasks(partnerId);

        if (analysis.missingInviteTasks.length === 0) {
            this.logger.log(`没有缺失的邀请任务，无需修复`);
            return {
                fixed: 0,
                skipped: 0,
                details: [],
            };
        }

        // 2. 获取合伙人档案
        const profile = await this.getProfileById(partnerId);

        // 3. 检查邀请任务上限（INVITE_V1 最多50次）
        const maxInviteCount = 50;
        const currentInviteCount = analysis.totalInviteTasks;
        const availableSlots = maxInviteCount - currentInviteCount;

        if (availableSlots <= 0) {
            this.logger.warn(`邀请任务已达上限，无法修复: current=${currentInviteCount}, max=${maxInviteCount}`);
            return {
                fixed: 0,
                skipped: analysis.missingInviteTasks.length,
                details: analysis.missingInviteTasks.map((task) => ({
                    downlinePartnerId: task.downlinePartnerId,
                    downlinePartnerCode: task.downlinePartnerCode,
                    status: "skipped" as const,
                    reason: "邀请任务已达上限（50次）",
                })),
            };
        }

        // 4. 修复缺失的邀请任务（最多修复到上限）
        const tasksToFix = analysis.missingInviteTasks.slice(0, availableSlots);
        const tasksToSkip = analysis.missingInviteTasks.slice(availableSlots);

        const details: Array<{
            downlinePartnerId: string;
            downlinePartnerCode: string;
            status: "fixed" | "skipped";
            reason?: string;
        }> = [];

        let fixed = 0;

        // 使用事务执行修复
        await this.partnerProfileRepository.manager.transaction(async (transactionalEntityManager) => {
            for (const task of tasksToFix) {
                try {
                    // 创建任务完成记录
                    await transactionalEntityManager.query(
                        `
                        INSERT INTO biz_task_completion_log (
                            task_code,
                            task_type,
                            partner_id,
                            uid,
                            related_partner_id,
                            related_uid,
                            event_type,
                            event_id,
                            business_params,
                            status,
                            created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                        [
                            "INVITE_V1",
                            "invite_success",
                            partnerId,
                            profile.uid,
                            task.downlinePartnerId,
                            task.downlineUid,
                            "partner.register_downline_L1",
                            `fix_${partnerId}_${task.downlinePartnerId}_${Date.now()}`,
                            JSON.stringify({
                                inviterPartnerCode: profile.partnerCode,
                                downlinePartnerCode: task.downlinePartnerCode,
                                fixedBy: adminId,
                                fixedAt: new Date().toISOString(),
                                originalJoinTime: task.joinTime,
                            }),
                            "completed",
                            task.joinTime, // 使用下线的加入时间作为任务完成时间
                        ],
                    );

                    fixed++;
                    details.push({
                        downlinePartnerId: task.downlinePartnerId,
                        downlinePartnerCode: task.downlinePartnerCode,
                        status: "fixed",
                    });

                    this.logger.log(
                        `已修复邀请任务: inviter=${partnerId}, downline=${task.downlinePartnerId} (${task.downlinePartnerCode})`,
                    );
                } catch (error) {
                    this.logger.error(
                        `修复邀请任务失败: inviter=${partnerId}, downline=${task.downlinePartnerId}, error=${error.message}`,
                    );
                    details.push({
                        downlinePartnerId: task.downlinePartnerId,
                        downlinePartnerCode: task.downlinePartnerCode,
                        status: "skipped",
                        reason: `修复失败: ${error.message}`,
                    });
                }
            }
        });

        // 5. 添加跳过的任务到详情
        for (const task of tasksToSkip) {
            details.push({
                downlinePartnerId: task.downlinePartnerId,
                downlinePartnerCode: task.downlinePartnerCode,
                status: "skipped",
                reason: "超出邀请任务上限",
            });
        }

        // 6. 清除该合伙人的积分缓存（因为积分已变化）
        this.pointsCacheService.invalidateUserCache(partnerId);

        // 7. 记录管理员操作日志
        await this.logAdminOperation(
            partnerId,
            "fix_invite_tasks",
            adminId,
            `修复缺失的邀请任务`,
            {
                totalDownlines: analysis.totalDownlines,
                totalInviteTasks: analysis.totalInviteTasks,
                missingCount: analysis.missingInviteTasks.length,
            },
            {
                fixed,
                skipped: tasksToSkip.length,
                details,
            },
        );

        this.logger.log(`邀请任务修复完成: fixed=${fixed}, skipped=${tasksToSkip.length}`);

        return {
            fixed,
            skipped: tasksToSkip.length,
            details,
        };
    }

    /**
     * 记录管理员操作日志
     */
    private async logAdminOperation(
        partnerId: string,
        operationType: string,
        adminId: string,
        reason: string | null,
        beforeData: any,
        afterData: any,
    ): Promise<void> {
        const log = this.adminLogRepository.create({
            partnerId,
            operationType,
            adminId,
            reason,
            beforeData,
            afterData,
        });

        await this.adminLogRepository.save(log);
    }
}

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PartnerHierarchyEntity } from "./entities/partner-hierarchy.entity";
import { PartnerProfileEntity } from "./entities/partner-profile.entity";
import { AdminOperationLogEntity } from "./entities/admin-operation-log.entity";
import {
    InvalidPartnerIdException,
    UplinkImmutableException,
    CircularReferenceException,
} from "./exceptions/partner.exception";

export interface PaginationDto {
    page: number;
    pageSize: number;
}

export interface DownlineList {
    items: PartnerHierarchyEntity[];
    total: number;
    page: number;
    pageSize: number;
}

@Injectable()
export class HierarchyService {
    private readonly logger = new Logger(HierarchyService.name);

    constructor(
        @InjectRepository(PartnerHierarchyEntity)
        private readonly hierarchyRepository: Repository<PartnerHierarchyEntity>,
        @InjectRepository(PartnerProfileEntity)
        private readonly profileRepository: Repository<PartnerProfileEntity>,
        @InjectRepository(AdminOperationLogEntity)
        private readonly adminLogRepository: Repository<AdminOperationLogEntity>,
    ) {}

    /**
     * 检查是否会形成短循环引用（2层以内）
     * 规则：
     * - 禁止：A -> B -> A（2层循环）
     * - 允许：A -> B -> C -> A（3层及以上循环）
     *
     * @param inviterId 邀请人ID
     * @param newMemberId 新成员ID
     * @returns true=会形成短循环，false=不会循环或循环层数>=3
     */
    async checkCircularReference(inviterId: string, newMemberId: string): Promise<boolean> {
        // 1. 自我邀请检测（1层循环：A -> A）
        if (inviterId === newMemberId) {
            this.logger.warn(`检测到自我邀请: inviter=${inviterId}`);
            return true;
        }

        // 2. 检查2层循环：A -> B -> A
        // 如果 inviterId 是 newMemberId 的直接下线（level=1），则会形成2层循环
        const query = `
            SELECT 1 as found
            FROM biz_partner_hierarchy
            WHERE parent_partner_id = ?
              AND child_partner_id = ?
              AND level = 1
              AND is_active = 1
            LIMIT 1
        `;

        try {
            const result = await this.hierarchyRepository.query(query, [newMemberId, inviterId]);

            if (result.length > 0) {
                this.logger.warn(
                    `检测到2层循环: inviter=${inviterId} 是 newMember=${newMemberId} 的直接下线，禁止建立关系`,
                );
                return true;
            }

            this.logger.log(`循环检测通过: inviter=${inviterId}, newMember=${newMemberId} (允许3层及以上循环)`);
            return false;
        } catch (error) {
            this.logger.error(`循环检测查询失败: ${error.message}`, error.stack);
            // 查询失败时为了安全起见，返回true阻止创建关系
            return true;
        }
    }

    /**
     * 创建层级关系
     * @param parentId 父级合伙人ID
     * @param childId 子级合伙人ID
     * @param channelId 可选的渠道ID
     */
    async createRelationship(parentId: string, childId: string, channelId?: string): Promise<void> {
        this.logger.log(`创建关系: parent=${parentId}, child=${childId}, channel=${channelId || "none"}`);

        // 1. 循环引用检测（必须在所有验证之前执行）
        const hasCircular = await this.checkCircularReference(parentId, childId);
        if (hasCircular) {
            throw new CircularReferenceException(parentId, childId);
        }

        // 2. 验证父级合伙人存在
        const parent = await this.profileRepository.findOne({
            where: { partnerId: parentId },
        });
        if (!parent) {
            throw new InvalidPartnerIdException(Number(parentId));
        }

        // 3. 验证子级合伙人存在
        const child = await this.profileRepository.findOne({
            where: { partnerId: childId },
        });
        if (!child) {
            throw new InvalidPartnerIdException(Number(childId));
        }

        // 4. 检查子级是否已有上级（level=1且isActive=true）
        const existingUplink = await this.hierarchyRepository.findOne({
            where: {
                childPartnerId: childId,
                level: 1,
                isActive: true,
            },
        });

        if (existingUplink) {
            throw new UplinkImmutableException(childId);
        }

        // 创建一级关系记录
        const level1Relation = this.hierarchyRepository.create({
            parentPartnerId: parentId,
            childPartnerId: childId,
            level: 1,
            sourceChannelId: channelId || null,
            isActive: true,
        });

        await this.hierarchyRepository.save(level1Relation);
        this.logger.log(`一级关系创建成功: ${level1Relation.id}`);

        // 检查父级是否有上级，如果有则创建二级关系
        const parentUplink = await this.hierarchyRepository.findOne({
            where: {
                childPartnerId: parentId,
                level: 1,
                isActive: true,
            },
        });

        if (parentUplink) {
            // 创建二级关系：grandparent -> child (level=2)
            const level2Relation = this.hierarchyRepository.create({
                parentPartnerId: parentUplink.parentPartnerId,
                childPartnerId: childId,
                level: 2,
                sourceChannelId: null, // 二级关系不记录渠道来源
                isActive: true,
            });

            await this.hierarchyRepository.save(level2Relation);
            this.logger.log(`二级关系创建成功: ${level2Relation.id} (grandparent=${parentUplink.parentPartnerId})`);
        }
    }

    /**
     * 获取下线列表
     * @param partnerId 合伙人ID
     * @param level 层级（1或2）
     * @param pagination 分页参数
     */
    async getDownlines(partnerId: string, level: 1 | 2, pagination: PaginationDto): Promise<DownlineList> {
        const { page, pageSize } = pagination;
        const skip = (page - 1) * pageSize;

        // 查询下线关系，默认只返回活跃关系
        const [items, total] = await this.hierarchyRepository.findAndCount({
            where: {
                parentPartnerId: partnerId,
                level,
                isActive: true,
            },
            skip,
            take: pageSize,
            order: {
                bindTime: "DESC",
            },
        });

        this.logger.log(`查询下线: partner=${partnerId}, level=${level}, total=${total}`);

        return {
            items,
            total,
            page,
            pageSize,
        };
    }

    /**
     * 查询直接上级
     * @param partnerId 合伙人ID
     */
    async getUplink(partnerId: string): Promise<PartnerHierarchyEntity | null> {
        const uplink = await this.hierarchyRepository.findOne({
            where: {
                childPartnerId: partnerId,
                level: 1,
                isActive: true,
            },
        });

        return uplink;
    }

    /**
     * 验证上级是否有效
     * @param uplinkId 上级合伙人ID
     */
    async validateUplink(uplinkId: string): Promise<boolean> {
        const uplink = await this.profileRepository.findOne({
            where: { partnerId: uplinkId },
        });
        return uplink !== null;
    }

    /**
     * 纠正上级关系（管理员操作）
     * @param partnerId 合伙人ID
     * @param newParentId 新的上级ID
     * @param adminId 管理员ID
     * @param reason 原因
     */
    async correctUplink(partnerId: string, newParentId: string, adminId: string, reason: string): Promise<void> {
        this.logger.log(`管理员 ${adminId} 纠正合伙人 ${partnerId} 的上级关系，新上级: ${newParentId}`);

        // 1. 循环引用检测（管理员操作也必须检测）
        const hasCircular = await this.checkCircularReference(newParentId, partnerId);
        if (hasCircular) {
            throw new CircularReferenceException(newParentId, partnerId);
        }

        // 2. 验证合伙人存在
        const partner = await this.profileRepository.findOne({
            where: { partnerId },
        });
        if (!partner) {
            throw new InvalidPartnerIdException(Number(partnerId));
        }

        // 3. 验证新上级存在
        const newParent = await this.profileRepository.findOne({
            where: { partnerId: newParentId },
        });
        if (!newParent) {
            throw new InvalidPartnerIdException(Number(newParentId));
        }

        // 查询旧的一级关系
        const oldL1Relation = await this.hierarchyRepository.findOne({
            where: {
                childPartnerId: partnerId,
                level: 1,
                isActive: true,
            },
        });

        // 查询旧的二级关系
        const oldL2Relation = await this.hierarchyRepository.findOne({
            where: {
                childPartnerId: partnerId,
                level: 2,
                isActive: true,
            },
        });

        // 记录操作前数据
        const beforeData = {
            oldL1Parent: oldL1Relation?.parentPartnerId || null,
            oldL2Parent: oldL2Relation?.parentPartnerId || null,
        };

        // 1. 标记旧关系为非活跃（保留历史数据）
        if (oldL1Relation) {
            oldL1Relation.isActive = false;
            await this.hierarchyRepository.save(oldL1Relation);
            this.logger.log(`旧一级关系已标记为非活跃: ${oldL1Relation.id}`);
        }

        if (oldL2Relation) {
            oldL2Relation.isActive = false;
            await this.hierarchyRepository.save(oldL2Relation);
            this.logger.log(`旧二级关系已标记为非活跃: ${oldL2Relation.id}`);
        }

        // 2. 创建新的一级关系
        const newL1Relation = this.hierarchyRepository.create({
            parentPartnerId: newParentId,
            childPartnerId: partnerId,
            level: 1,
            sourceChannelId: null, // 纠错时不记录渠道来源
            isActive: true,
        });
        await this.hierarchyRepository.save(newL1Relation);
        this.logger.log(`新一级关系已创建: ${newL1Relation.id}`);

        // 3. 重建二级关系：检查新上级是否有上级
        const newParentUplink = await this.hierarchyRepository.findOne({
            where: {
                childPartnerId: newParentId,
                level: 1,
                isActive: true,
            },
        });

        let newL2ParentId: string | null = null;
        if (newParentUplink) {
            // 创建新的二级关系
            const newL2Relation = this.hierarchyRepository.create({
                parentPartnerId: newParentUplink.parentPartnerId,
                childPartnerId: partnerId,
                level: 2,
                sourceChannelId: null,
                isActive: true,
            });
            await this.hierarchyRepository.save(newL2Relation);
            newL2ParentId = newParentUplink.parentPartnerId;
            this.logger.log(`新二级关系已创建: ${newL2Relation.id} (grandparent=${newParentUplink.parentPartnerId})`);
        }

        // 记录操作后数据
        const afterData = {
            newL1Parent: newParentId,
            newL2Parent: newL2ParentId,
        };

        // 4. 记录操作日志
        await this.logAdminOperation(partnerId, "correct_uplink", adminId, reason, beforeData, afterData);

        this.logger.log(`合伙人 ${partnerId} 的上级关系纠正完成`);
    }

    /**
     * 重建层级关系（别名方法，调用correctUplink）
     * @param partnerId 合伙人ID
     * @param newParentId 新的上级ID
     * @param adminId 管理员ID
     * @param reason 原因
     */
    async rebuildHierarchy(partnerId: string, newParentId: string, adminId: string, reason: string): Promise<void> {
        return this.correctUplink(partnerId, newParentId, adminId, reason);
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

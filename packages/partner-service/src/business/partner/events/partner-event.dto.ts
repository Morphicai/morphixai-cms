/**
 * 合伙人事件类型枚举
 */
export enum PartnerEventType {
    /** 用户自己注册成为合伙人 */
    REGISTER_SELF = "register_self",
    /** 合伙人的一级下线注册 */
    REGISTER_DOWNLINE_L1 = "register_downline_L1",
}

/**
 * 合伙人事件基础接口
 */
export interface PartnerEventPayload {
    /** 事件类型 */
    eventType: PartnerEventType;
    /** 合伙人ID */
    partnerId: string;
    /** 合伙人编号 */
    partnerCode: string;
    /** 用户ID */
    uid: string;
    /** 事件时间戳 */
    timestamp: number;
}

/**
 * 用户注册成为合伙人事件
 */
export interface RegisterSelfEventPayload extends PartnerEventPayload {
    eventType: PartnerEventType.REGISTER_SELF;
}

/**
 * 一级下线注册事件
 */
export interface RegisterDownlineL1EventPayload extends PartnerEventPayload {
    eventType: PartnerEventType.REGISTER_DOWNLINE_L1;
    /** 下线合伙人ID */
    downlinePartnerId: string;
    /** 下线合伙人编号 */
    downlinePartnerCode: string;
    /** 下线用户ID */
    downlineUid: string;
    /** 来源渠道ID（可选） */
    sourceChannelId?: string;
}

import { HttpException, HttpStatus } from "@nestjs/common";

export enum PartnerErrorCode {
    PARTNER_ALREADY_EXISTS = "PARTNER_ALREADY_EXISTS",
    INVALID_INVITER = "INVALID_INVITER",
    INVALID_INVITER_CODE = "INVALID_INVITER_CODE",
    INVALID_CHANNEL = "INVALID_CHANNEL",
    CHANNEL_NOT_BELONG_TO_INVITER = "CHANNEL_NOT_BELONG_TO_INVITER",
    PARTNER_FROZEN = "PARTNER_FROZEN",
    UPLINK_IMMUTABLE = "UPLINK_IMMUTABLE",
    DUPLICATE_PARTNER_CODE = "DUPLICATE_PARTNER_CODE",
    DUPLICATE_USER_ID = "DUPLICATE_USER_ID",
    INVALID_PARTNER_ID = "INVALID_PARTNER_ID",
    INVALID_LEVEL = "INVALID_LEVEL",
    ADMIN_ONLY = "ADMIN_ONLY",
    FROZEN_PARTNER_RESTRICTED = "FROZEN_PARTNER_RESTRICTED",
    CIRCULAR_REFERENCE = "CIRCULAR_REFERENCE",
    DUPLICATE_TEAM_NAME = "DUPLICATE_TEAM_NAME",
    TEAM_NAME_IMMUTABLE = "TEAM_NAME_IMMUTABLE",
    CHANNEL_LIMIT_EXCEEDED = "CHANNEL_LIMIT_EXCEEDED",
}

export class PartnerException extends HttpException {
    constructor(public readonly code: PartnerErrorCode, message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
        super({ code, message }, status);
    }
}

export class PartnerAlreadyExistsException extends PartnerException {
    constructor(uid: string) {
        super(PartnerErrorCode.PARTNER_ALREADY_EXISTS, `用户 ${uid} 已是合伙人`, HttpStatus.BAD_REQUEST);
    }
}

export class InvalidInviterException extends PartnerException {
    constructor(inviterCode: string) {
        super(PartnerErrorCode.INVALID_INVITER, `邀请人 ${inviterCode} 不存在或已被冻结`, HttpStatus.BAD_REQUEST);
    }
}

export class InvalidChannelException extends PartnerException {
    constructor(channelCode: string) {
        super(PartnerErrorCode.INVALID_CHANNEL, `渠道 ${channelCode} 不存在或已被禁用`, HttpStatus.BAD_REQUEST);
    }
}

export class ChannelNotBelongToInviterException extends PartnerException {
    constructor(channelCode: string, inviterCode: string) {
        super(
            PartnerErrorCode.CHANNEL_NOT_BELONG_TO_INVITER,
            `渠道 ${channelCode} 不属于邀请人 ${inviterCode}`,
            HttpStatus.BAD_REQUEST,
        );
    }
}

export class PartnerFrozenException extends PartnerException {
    constructor(partnerCode: string) {
        super(PartnerErrorCode.PARTNER_FROZEN, `合伙人 ${partnerCode} 已被冻结`, HttpStatus.FORBIDDEN);
    }
}

export class DuplicateUserIdException extends PartnerException {
    constructor(uid: string) {
        super(PartnerErrorCode.DUPLICATE_USER_ID, `用户ID ${uid} 已关联其他合伙人`, HttpStatus.CONFLICT);
    }
}

export class InvalidPartnerIdException extends PartnerException {
    constructor(partnerId: number) {
        super(PartnerErrorCode.INVALID_PARTNER_ID, `合伙人 ${partnerId} 不存在`, HttpStatus.NOT_FOUND);
    }
}

export class UplinkImmutableException extends PartnerException {
    constructor(childPartnerId: string) {
        super(
            PartnerErrorCode.UPLINK_IMMUTABLE,
            `合伙人 ${childPartnerId} 已有上级，上级关系不可修改`,
            HttpStatus.CONFLICT,
        );
    }
}

export class CircularReferenceException extends PartnerException {
    constructor(inviterId: string, newMemberId: string) {
        super(
            PartnerErrorCode.CIRCULAR_REFERENCE,
            `无法建立邀请关系：该合伙人已经是您的上级或上级的上级，不能将其设置为您的下级`,
            HttpStatus.BAD_REQUEST,
        );
    }
}

export class DuplicateTeamNameException extends PartnerException {
    constructor(teamName: string) {
        super(
            PartnerErrorCode.DUPLICATE_TEAM_NAME,
            `团队名称 "${teamName}" 已被使用，请更换其他名称`,
            HttpStatus.CONFLICT,
        );
    }
}

export class TeamNameImmutableException extends PartnerException {
    constructor() {
        super(PartnerErrorCode.TEAM_NAME_IMMUTABLE, `团队名称已设置，不允许修改`, HttpStatus.FORBIDDEN);
    }
}

export class ChannelLimitExceededException extends PartnerException {
    constructor(limit: number) {
        super(
            PartnerErrorCode.CHANNEL_LIMIT_EXCEEDED,
            `推广链接数量已达上限（${limit}个），无法继续创建`,
            HttpStatus.FORBIDDEN,
        );
    }
}

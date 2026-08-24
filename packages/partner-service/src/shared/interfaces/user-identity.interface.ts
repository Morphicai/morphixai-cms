/**
 * 通用用户标识接口
 * 用于支持多种用户来源（WeMade、Steam、Discord 等）
 */
export interface UserIdentity {
    /** 用户 ID */
    userId: string;

    /** 用户来源 */
    userSource: UserSource;
}

/**
 * 用户来源枚举
 */
export enum UserSource {
    /** WeMade 账号 */
    WEMADE = "wemade",

    /** 内部账号 */
    INTERNAL = "internal",

    /** Steam 账号 */
    STEAM = "steam",

    /** Discord 账号 */
    DISCORD = "discord",

    /** 其他第三方 */
    OTHER = "other",
}

/**
 * 扩展 Express Request，添加通用用户标识
 */
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            /** 客户端用户（来自 ClientUserAuthGuard） */
            clientUser?: UserIdentity;
        }
    }
}

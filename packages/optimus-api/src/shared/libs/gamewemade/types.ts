/**
 * GameWemade SDK 类型定义
 */

/**
 * SDK 配置
 */
export interface SDKConfig {
    /** 开放平台开发者身份ID，由Quick官方SDK分配 */
    openId: string;
    /** SDK分配的加密串 */
    openKey: string;
    /** 产品CODE，在Quick官方SDK后台获取 */
    productCode: string;
    /** API 基础URL，默认为 https://sdkapi.gamewemade.com */
    baseUrl?: string;
    /** CPS分包标识，选传，不传系统默认website */
    channelCode?: string;
}

/**
 * API 响应格式
 */
export interface ApiResponse<T = any> {
    /** 接口验证状态，若通过验证为true，否则为false */
    status: boolean;
    /** Status为false时，message有值，为错误提示语 */
    message: string;
    /** 如果status为true时，data数组包含了返回数据 */
    data: T;
}

/**
 * 用户注册参数
 */
export interface UserRegisterParams {
    /** 注册用户名 */
    username: string;
    /** 注册密码（原始密码，客户端会自动进行MD5编码） */
    password: string;
}

/**
 * 用户登录参数
 */
export interface UserLoginParams {
    /** 登录用户名 */
    username: string;
    /** 登录密码（原始密码，客户端会自动进行MD5编码） */
    password: string;
}

/**
 * 用户信息
 */
export interface UserInfo {
    /** 玩家uid */
    uid: string;
    /** 玩家用户名 */
    username: string;
    /** 认证token */
    authToken?: string;
    /** 玩家可游戏时长（秒） */
    timeLeft?: number;
}

/**
 * OAuth 登录参数
 */
export interface OAuthParams {
    /** 完成登录后的回调地址 */
    successUrl: string;
    /** 取消时跳转的URL（可选） */
    cancelUrl?: string;
}

/**
 * OAuth 响应
 */
export interface OAuthResponse {
    /** 登录页面URL */
    url: string;
}

/**
 * 检查Token参数
 */
export interface CheckTokenParams {
    /** 认证token */
    authToken: string;
    /** 玩家uid（可选，用于验证） */
    uid?: string;
}

/**
 * 订单查询参数
 */
export interface QueryOrderParams {
    /** SDK订单号（可选） */
    orderNo?: string;
    /** 游戏订单号（可选） */
    productOrderNo?: string;
    /** 支付渠道订单号（可选） */
    channelOrderNo?: string;
    /** 玩家uid（可选） */
    uid?: string;
    /** 开始时间，格式为unix时间戳（可选） */
    startTime?: number;
    /** 结束时间，格式为unix时间戳（可选） */
    endTime?: number;
    /** 页码，从1开始（可选） */
    page?: number;
    /** 每页数量（可选） */
    pageSize?: number;
}

/**
 * 订单信息
 */
export interface OrderInfo {
    /** SDK订单号 */
    orderNo: string;
    /** SDK产品名称 */
    productName: string;
    /** SDK产品ID */
    productid: number;
    /** SDK账号ID */
    uid: string;
    /** 订单游戏下单金额 */
    amount: number;
    /** 订单实际支付金额 */
    dealAmount: number;
    /** 游戏订单号 */
    productOrderNo: string;
    /** 支付渠道订单号 */
    channelOrderNo: string;
    /** 支付方式ID 8：iOS内购 */
    payType: number;
    /** 订单商品ID */
    goodsId: string;
    /** 订单对应玩家游戏区服名 */
    serverName: string;
    /** 订单对应玩家游戏角色名 */
    roleName: string;
    /** 订单扩展参数 */
    extrasParams: string;
    /** 订单退款时间，格式为unix时间戳 */
    voidedTime: number;
}

/**
 * 同步订单参数
 */
export interface SyncOrderParams {
    /** SDK用户的账号ID */
    userId: string;
    /** 游戏商品id（可选） */
    goodsId?: string;
    /** 游戏订单号（可选） */
    cpOrderNo?: string;
    /** 支付渠道的订单号（可选） */
    channelOrderNo?: string;
    /** 订单标题 */
    orderSubject: string;
    /** 用户角色名 */
    roleName: string;
    /** 游戏区服名 */
    serverName: string;
    /** 角色ID（可选） */
    roleId?: string;
    /** 区服ID（可选） */
    serverId?: string;
    /** 订单金额 */
    amount: number;
    /** 商品名称（可选） */
    goodsName?: string;
    /** 用户角色等级（可选） */
    roleLevel?: number;
    /** 订单保留参数（可选） */
    extrasParams?: string;
    /** 订单回调地址（可选） */
    callbackUrl?: string;
    /** 支付方式ID，ID获取请参照SDK后台支付配置 */
    payType: number;
    /** 订单的设备信息（可选） */
    deviceId?: string;
    /** 订单支付状态，默认为0，取固定值：1．支付成功 0．支付失败（可选） */
    payStatus?: number;
    /** 支付时间，格式为unix秒级时间戳。如果payStatus=1则payTime字段必传（可选） */
    payTime?: number;
    /** 订单发货状态，默认为0，取固定值：1. 发货成功 0. 发货失败（可选） */
    asyncStatus?: number;
}

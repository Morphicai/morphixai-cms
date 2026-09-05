import { SetMetadata } from "@nestjs/common";

/**
 * 声明接口所需的**服务**能力授权(grant)。
 *
 * 用法:@RequireGrant("user-profile:read-full"),类级和方法级都可以挂,方法级优先。
 * 挂了它的接口只接受 service token,并要求调用方在服务目录里被授予该项 grant。
 *
 * 与 @Perm 的区别不是粒度而是**主体**:@Perm 回答"这个人能做什么",本装饰器回答
 * "这个服务能做什么"。两套体系刻意保持独立——服务的能力不能通过转发一个高权限
 * 用户的 token 获得,否则任何服务只要能拿到管理员 token 就自动拥有全部能力,
 * grants 配置就形同虚设。
 */
export const REQUIRED_GRANT_KEY = "requiredGrant";

export const RequireGrant = (grant: string) => SetMetadata(REQUIRED_GRANT_KEY, grant);

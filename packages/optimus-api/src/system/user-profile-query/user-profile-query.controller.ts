import { Controller, Get, NotFoundException, Param, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ServiceAuth } from "../../shared/decorators/auth-mode.decorator";
import { RequireGrant } from "../../shared/decorators/require-grant.decorator";
import { ServiceGrantGuard } from "../../shared/guards/service-grant.guard";
import { ClientUserService } from "../../business/client-user/client-user.service";
import { ResultData } from "../../shared/utils/result";

/**
 * 跨服务的用户资料查询。**服务对服务**的接口，不给浏览器用。
 *
 * 由来：没有这个能力时，每个需要"显示某个用户是谁"的业务服务都会各自冗余存一份
 * 快照，此后不再跟主表更新——`partner_profile.username` 就是已验证的漂移案例。
 *
 * 两道门，缺一不可：
 * 1. `@ServiceAuth()` —— 只认 service token，用户 token 一律拒（401）
 * 2. `@RequireGrant(...)` + `ServiceGrantGuard` —— grants 每次从服务目录现读（403）
 *
 * **"登记过"不等于"可信"**：三方服务默认 grants 为空，两档都要显式授予。
 *
 * 为什么分成两个路由而不是一个路由按 grants 决定给多少字段：授权判断留在装饰器里
 * 是静态可查的（grep `@RequireGrant` 就知道谁需要什么），挪进 handler 里按
 * `request.service.grants` 分支就变成了"看代码才知道"，而且很容易在后续改动中漏掉。
 */
@ApiTags("跨服务用户资料查询")
@Controller("service/user-profile")
@UseGuards(ServiceGrantGuard)
export class UserProfileQueryController {
    constructor(private readonly clientUserService: ClientUserService) {}

    @Get("basic/:userId")
    @ServiceAuth()
    @RequireGrant("user-profile:read-basic")
    @ApiOperation({ summary: "按 uid 查用户基础资料（用户名/昵称/头像）" })
    @ApiParam({ name: "userId", description: "client user 的 userId" })
    async getBasic(@Param("userId") userId: string): Promise<ResultData> {
        return ResultData.ok(await this.requireProfile(userId, "basic"));
    }

    @Get("full/:userId")
    @ServiceAuth()
    @RequireGrant("user-profile:read-full")
    @ApiOperation({ summary: "按 uid 查用户完整资料（含邮箱、状态、注册时间）" })
    @ApiParam({ name: "userId", description: "client user 的 userId" })
    async getFull(@Param("userId") userId: string): Promise<ResultData> {
        return ResultData.ok(await this.requireProfile(userId, "full"));
    }

    /**
     * 用户不存在时抛 404，而不是返回 `{}` 或 null。
     * 空对象会被调用方当成"查到了但资料是空的"，然后把空昵称渲染出去——
     * 那种 bug 要到线上看到空白才发现。
     */
    private async requireProfile(userId: string, level: "basic" | "full") {
        const profile = await this.clientUserService.findPublicProfileById(userId, level);
        if (!profile) {
            throw new NotFoundException(`用户不存在: ${userId}`);
        }
        return profile;
    }
}

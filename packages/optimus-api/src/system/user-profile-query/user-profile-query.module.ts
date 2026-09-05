import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ClientUserModule } from "../../business/client-user/client-user.module";
import { ServiceOpsModule } from "../service-ops/service-ops.module";
import { UserProfileQueryController } from "./user-profile-query.controller";

/**
 * 独立成一个模块，而不是往 `ClientUserController` 里加两个方法：
 * 那个控制器整体是"用户对自己"的语义（register/login/profile/me），
 * 混进"服务对服务"的接口后，类级默认与方法级覆盖的关系会变得难判断。
 *
 * 另外 `AuthModule` 本身 import 了 `ClientUserModule`——把需要 AuthModule
 * 的控制器放进 ClientUserModule 会形成循环，得靠 forwardRef 绕，不值得。
 *
 * 三个 import 都是必需的，少一个就启动失败（tsc 与单测都发现不了，只有真起进程会报）：
 * - `AuthModule` —— 提供 `ServiceGrantGuard` 与 `ServiceTokenService`
 * - `ServiceOpsModule` —— `ServiceGrantGuard` 在**本模块的注入上下文**里被实例化，
 *   它依赖的 `ServiceRegistryService` 必须在这里能解析到；AuthModule 导出了
 *   guard 本身，但没有把 ServiceOpsModule 一起再导出
 * - `ClientUserModule` —— 提供 `ClientUserService`
 */
@Module({
    imports: [AuthModule, ServiceOpsModule, ClientUserModule],
    controllers: [UserProfileQueryController],
})
export class UserProfileQueryModule {}

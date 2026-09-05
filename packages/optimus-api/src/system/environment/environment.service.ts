import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/** 对外暴露的部署环境名。与 NODE_ENV 的原始取值刻意解耦——见 normalizeEnvironment */
export const ENVIRONMENTS = ["dev", "test", "staging", "prod"] as const;

export type EnvironmentName = (typeof ENVIRONMENTS)[number];

export interface EnvironmentInfo {
    environment: EnvironmentName;
    rootDomain: string;
    cookieDomain: string;
}

/**
 * NODE_ENV 的实际取值是历史形成的（`development` / `production` / `e2e`…），
 * 直接透出去会让消费方去匹配一堆同义词。这里收敛成四个稳定的对外名字。
 *
 * 不认识的值一律归到 `prod`：判错方向的代价不对称——把生产误判成开发，
 * 消费方可能放宽 cookie 域或打开调试出口；反过来只是保守一点。
 */
export function normalizeEnvironment(nodeEnv: string | undefined): EnvironmentName {
    switch ((nodeEnv ?? "").trim().toLowerCase()) {
        case "dev":
        case "development":
            return "dev";
        case "test":
        case "e2e":
            return "test";
        case "staging":
        case "stage":
        case "pre":
            return "staging";
        default:
            return "prod";
    }
}

/**
 * 环境基础信息。给 C 端、子应用、以及 `@optimus/platform-client` 用：
 * 它们需要知道根域名（拼绝对 URL）与 cookie 域（跨子域共享登录态），
 * 而这两个值随部署环境变化，硬编码在前端就会每换一个环境改一次代码。
 *
 * 这里只做"读取出口"，不引入任何新配置项——值仍来自 `SITE_DOMAIN` / `COOKIE_DOMAIN`，
 * 与 `oss.controller.ts` / `client-user.controller.ts` 实际生效的是同一份。
 */
@Injectable()
export class EnvironmentService {
    constructor(private readonly config: ConfigService) {}

    getInfo(): EnvironmentInfo {
        return {
            environment: normalizeEnvironment(this.config.get<string>("NODE_ENV") ?? process.env.NODE_ENV),
            rootDomain: this.resolveRootDomain(),
            // COOKIE_DOMAIN 只存在于环境变量（config yml 里没有对应条目），
            // 与 client-user.controller.ts 签发 cookie 时读的是同一个值。
            // **留空是本地开发的正确状态**，不是漏配：host-only cookie 才能被
            // localhost 接收，配了域名反而会被浏览器拒收（见 .env.example 的说明）
            cookieDomain: this.config.get<string>("COOKIE_DOMAIN") ?? process.env.COOKIE_DOMAIN ?? "",
        };
    }

    /**
     * 根域名有两条历史读取路径,取值并不一致,这里按"配置系统里的正式条目"为准:
     *   - `app.file.domain` —— config yml 的正式条目,形如
     *     `${SITE_DOMAIN:http://localhost:8084}`,**带默认值**
     *   - `process.env.SITE_DOMAIN` —— `oss.controller.ts` 直接读的裸环境变量,
     *     没配就是空,它自己再去"从其他环境变量构建"
     *
     * 选前者是因为对外契约需要一个可用的非空值(消费方拿它拼绝对 URL);
     * 裸环境变量作为兜底,保证显式配了 SITE_DOMAIN 时两条路径结果相同。
     */
    private resolveRootDomain(): string {
        return (
            this.config.get<string>("app.file.domain") ??
            this.config.get<string>("SITE_DOMAIN") ??
            process.env.SITE_DOMAIN ??
            ""
        );
    }
}

import { Controller, Get, Query, HttpCode, HttpStatus, Logger, UnauthorizedException } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";
import { DeployWebhookService } from "./deploy-webhook.service";

@ApiExcludeController()
@Controller("hooks")
export class DeployWebhookController {
    private readonly logger = new Logger(DeployWebhookController.name);
    private readonly SECRET = "deploy2024"; // 简单的秘钥

    constructor(private readonly deployWebhookService: DeployWebhookService) {}

    @Get("deploy")
    @HttpCode(HttpStatus.OK)
    @AllowAnonymous()
    async deploy(@Query("secret") secret: string) {
        this.logger.log("📨 收到部署请求");

        // 验证秘钥
        if (secret !== this.SECRET) {
            this.logger.warn("❌ 秘钥验证失败");
            throw new UnauthorizedException("秘钥错误");
        }

        this.logger.log("✅ 秘钥验证通过");
        const result = await this.deployWebhookService.deploy();
        return {
            ...result,
            timestamp: new Date().toISOString(),
        };
    }
}

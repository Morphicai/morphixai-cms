import { Module } from "@nestjs/common";
import { DeployWebhookController } from "./deploy-webhook.controller";
import { DeployWebhookService } from "./deploy-webhook.service";

@Module({
    controllers: [DeployWebhookController],
    providers: [DeployWebhookService],
    exports: [DeployWebhookService],
})
export class DeployWebhookModule {}

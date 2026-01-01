import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderController } from "./order.controller";
import { AdminOrderController } from "./admin-order.controller";
import { OrderService } from "./order.service";
import { AdminOrderService } from "./admin-order.service";
import { OrderEntity } from "./entities/order.entity";
import { DecryptService } from "./services/decrypt.service";
import { GameWemadeTokenValidationService } from "./services/token-validation.service";
import { PaymentCallbackService } from "./services/payment-callback.service";
import { ProductHandlerService } from "./services/product-handler.service";
import { ProductValidatorService } from "./services/product-validator.service";
import { MockPaymentService } from "./services/mock-payment.service";
import { MultiRegionRoleHandler } from "./handlers/multi-region-role-handler";
import { CreateGuildHandler } from "./handlers/create-guild-handler";
// import { CharacterAllServerHandler } from "./handlers/character-all-server-handler"; // 游戏特定功能
// import { GuildSingleServerHandler } from "./handlers/guild-single-server-handler"; // 游戏特定功能
// import { GuildAllServerHandler } from "./handlers/guild-all-server-handler"; // 游戏特定功能
import { MultiRegionRoleValidator } from "./validators/multi-region-role.validator";
import { CreateGuildValidator } from "./validators/create-guild.validator";
import { UserModule } from "../../system/user/user.module";

@Module({
    imports: [TypeOrmModule.forFeature([OrderEntity]), UserModule],
    controllers: [OrderController, AdminOrderController],
    providers: [
        OrderService,
        AdminOrderService,
        DecryptService,
        GameWemadeTokenValidationService,
        PaymentCallbackService,
        ProductHandlerService,
        ProductValidatorService,
        MockPaymentService,
        MultiRegionRoleHandler,
        CreateGuildHandler,
        // CharacterAllServerHandler, // 游戏特定功能，已移除
        // GuildSingleServerHandler, // 游戏特定功能，已移除
        // GuildAllServerHandler, // 游戏特定功能，已移除
        MultiRegionRoleValidator,
        CreateGuildValidator,
    ],
    exports: [
        OrderService,
        DecryptService,
        GameWemadeTokenValidationService,
        PaymentCallbackService,
        ProductHandlerService,
        ProductValidatorService,
        MockPaymentService,
    ],
})
export class OrderModule {}

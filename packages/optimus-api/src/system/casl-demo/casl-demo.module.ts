import { Module } from "@nestjs/common";
import { CaslDemoController } from "./casl-demo.controller";
import { CaslModule } from "../../shared/casl/casl.module";
import { permissions } from "./casl-demo.permission";

@Module({
    imports: [CaslModule.register(permissions)],
    controllers: [CaslDemoController],
})
export class CaslDemoModule {}

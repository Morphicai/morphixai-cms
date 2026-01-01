import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TestConfigService } from "./test-config.service";

@Global()
@Module({
    imports: [ConfigModule],
    providers: [TestConfigService],
    exports: [TestConfigService],
})
export class TestConfigModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { I18nEntryEntity } from "./entities/i18n-entry.entity";
import { I18nService } from "./i18n.service";
import { I18nController } from "./i18n.controller";
import { PublicI18nController } from "./public-i18n.controller";
// 副作用 import:模块加载即把本模块的 Agent 工具声明注册进聚合表
import "./i18n.agent-tools";

@Module({
    imports: [TypeOrmModule.forFeature([I18nEntryEntity])],
    controllers: [I18nController, PublicI18nController],
    providers: [I18nService],
})
export class I18nModule {}

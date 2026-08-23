import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { I18nEntryEntity } from "./entities/i18n-entry.entity";
import { I18nService } from "./i18n.service";
import { I18nController } from "./i18n.controller";
import { PublicI18nController } from "./public-i18n.controller";
import { AiModule } from "../ai/ai.module";

@Module({
    imports: [TypeOrmModule.forFeature([I18nEntryEntity]), AiModule],
    controllers: [I18nController, PublicI18nController],
    providers: [I18nService],
})
export class I18nModule {}

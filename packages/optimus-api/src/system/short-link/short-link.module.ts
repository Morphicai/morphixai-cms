import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ShortLinkEntity } from "./entities/short-link.entity";
import { ShortLinkService } from "./short-link.service";
import { ShortLinkController } from "./short-link.controller";
import { PublicShortLinkController } from "./public-short-link.controller";

@Module({
    imports: [TypeOrmModule.forFeature([ShortLinkEntity])],
    controllers: [ShortLinkController, PublicShortLinkController],
    providers: [ShortLinkService],
    exports: [ShortLinkService],
})
export class ShortLinkModule {}

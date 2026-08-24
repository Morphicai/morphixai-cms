import { Module } from "@nestjs/common";
import "./dictionary.agent-tools";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DictionaryEntity } from "./entities/dictionary.entity";
import { DictionaryCollectionEntity } from "./entities/dictionary-collection.entity";
import { DictionaryService } from "./dictionary.service";
import { DictionaryCollectionService } from "./dictionary-collection.service";
import { DictionaryController } from "./dictionary.controller";
import { DictionaryCollectionController } from "./dictionary-collection.controller";
import { PublicDictionaryController } from "./public-dictionary.controller";
import { UserDictionaryController } from "./user-dictionary.controller";

@Module({
    imports: [TypeOrmModule.forFeature([DictionaryEntity, DictionaryCollectionEntity])],
    controllers: [
        DictionaryController,
        DictionaryCollectionController,
        PublicDictionaryController,
        UserDictionaryController,
    ],
    providers: [DictionaryService, DictionaryCollectionService],
    exports: [DictionaryService, DictionaryCollectionService],
})
export class DictionaryModule {}

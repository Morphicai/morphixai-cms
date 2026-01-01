import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentService } from "./document.service";
import { DocumentController } from "./document.controller";
import { PublicDocumentController } from "./public-document.controller";
import { DocumentEntity } from "./entities/document.entity";
import { DocumentPermEntity } from "./entities/document-perm.entity";

@Module({
    imports: [TypeOrmModule.forFeature([DocumentEntity, DocumentPermEntity])],
    controllers: [DocumentController, PublicDocumentController],
    providers: [DocumentService],
    exports: [DocumentService],
})
export class DocumentModule {}

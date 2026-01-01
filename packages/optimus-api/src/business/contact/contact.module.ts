import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentModule } from "../../system/document/document.module";
import { ContactService } from "./contact.service";
import { ContactController } from "./contact.controller";
import { ContactEntity } from "./entities/contact.entity";
import { FeedbackEntity } from "./entities/feedback.entity";

@Module({
    imports: [TypeOrmModule.forFeature([ContactEntity, FeedbackEntity]), DocumentModule],
    controllers: [ContactController],
    providers: [ContactService],
})
export class ContactModule {}

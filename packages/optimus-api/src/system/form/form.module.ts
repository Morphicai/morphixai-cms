import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FormSchemaEntity } from "./entities/form-schema.entity";
import { FormEntryEntity } from "./entities/form-entry.entity";
import { FormService } from "./form.service";
import { FormController } from "./form.controller";
import { PublicFormController } from "./public-form.controller";
import { AiModule } from "../ai/ai.module";

@Module({
    imports: [TypeOrmModule.forFeature([FormSchemaEntity, FormEntryEntity]), AiModule],
    controllers: [FormController, PublicFormController],
    providers: [FormService],
})
export class FormModule {}

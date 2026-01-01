import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { CaslAbilityFactory } from "../../shared/casl/casl-ability.factory";
import { Action } from "../../shared/enums/casl.enum";
import { insArticle } from "../../shared/casl/article.model";
import { PoliciesGuard } from "../../shared/guards/policies.guard";
import { UseAbility } from "../../shared/decorators/use-ability.decorator";

@Controller("/demo")
@ApiBearerAuth()
export class CaslDemoController {
    constructor(private caslAbilityFactory: CaslAbilityFactory) {}

    @Get("casl")
    @UseGuards(PoliciesGuard)
    @UseAbility((ability) => ability.can(Action.Read, insArticle, "isPublish"))
    decorators() {
        return "casl decorators demo";
    }

    @Get("casl/custom")
    findAll(@Req() req) {
        console.log("show fields", this.caslAbilityFactory.allowedFieldsOf(req.user, "read", insArticle));
        return "casl demo";
    }
}

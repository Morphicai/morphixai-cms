import { Controller, Get, Post, Param, Body, Query, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { ResultData } from "../../shared/utils/result";

import { ContactService } from "./contact.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { CreateContactFeedbackDto } from "./dto/create-contact-feedback.dto";
import { FindContactFeedbackDto } from "./dto/find-contact-feedback.dto";

import { ContactEntity } from "./entities/contact.entity";
import { FeedbackEntity } from "./entities/feedback.entity";

@ApiTags("联系我们")
@ApiBearerAuth()
@Controller("/m/contact")
export class ContactController {
    constructor(private readonly contactService: ContactService) {}

    @Post()
    @HttpCode(200)
    @ApiOperation({ summary: "创建联系方式" })
    @ApiResult(ContactEntity)
    create(@Body() params: CreateContactDto): Promise<ResultData> {
        return this.contactService.create(params);
    }

    @Get("")
    @HttpCode(200)
    @ApiOperation({ summary: "获取联系信息" })
    @ApiResult(ContactEntity)
    @AllowAnonymous()
    findAllContact(): Promise<ResultData> {
        return this.contactService.findAllContact();
    }

    @Post("/update/:id")
    @HttpCode(200)
    @ApiOperation({ summary: "根据ID更新联系方式" })
    @ApiResult(ContactEntity)
    update(@Param("id") id: number, @Body() params: CreateContactDto): Promise<ResultData> {
        return this.contactService.update(id, params);
    }

    @Post("feedback")
    @HttpCode(200)
    @ApiOperation({ summary: "提交意见反馈" })
    @AllowAnonymous()
    @ApiResult(FeedbackEntity)
    feedback(@Body() params: CreateContactFeedbackDto): Promise<ResultData> {
        return this.contactService.createFeedback(params);
    }

    @Get("feedback/list")
    @HttpCode(200)
    @ApiOperation({ summary: "分页获取所有意见反馈" })
    @ApiResult(FeedbackEntity, true, true)
    findAllFeedback(@Query() search: FindContactFeedbackDto): Promise<ResultData> {
        return this.contactService.findAllFeedback(search);
    }
}

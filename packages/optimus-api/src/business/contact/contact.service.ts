import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { getManager, Repository } from "typeorm";
import { plainToClass, classToPlain } from "class-transformer";

import { DocumentService } from "../../system/document/document.service";
import { ResultData } from "../../shared/utils/result";
import { AppHttpCode } from "../../shared/enums/code.enum";
import { Nodemailer, INodemailerConfig } from "../../shared/utils/nodemailer";
import getFeedbackAddressee from "./helps/getFeedbackAddressee";
import createMailTemplate, { IMailTemplate } from "./helps/createMailTemplate";

import { ContactEntity } from "./entities/contact.entity";
import { FeedbackEntity } from "./entities/feedback.entity";

import { CreateContactDto } from "./dto/create-contact.dto";
import { CreateContactFeedbackDto } from "./dto/create-contact-feedback.dto";
import { FindContactFeedbackDto } from "./dto/find-contact-feedback.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

@Injectable()
export class ContactService extends Nodemailer {
    constructor(
        @InjectRepository(ContactEntity)
        private readonly repo: Repository<ContactEntity>,
        @InjectRepository(FeedbackEntity)
        private readonly feebbackRepo: Repository<FeedbackEntity>,
        private readonly appConfig: ConfigService,
        private readonly documentService: DocumentService,
    ) {
        // 初始化邮箱配置信息
        const nodemailConfig: INodemailerConfig = {
            host: appConfig.get<string>("mail.host"),
            from: appConfig.get<string>("mail.account"),
            code: appConfig.get<string>("mail.code"),
        };
        super(nodemailConfig);
    }

    async create(createContactDto: CreateContactDto): Promise<ResultData> {
        const { address, engAddress, email, phoneNum } = createContactDto;
        const bizData = plainToClass(ContactEntity, {
            address,
            engAddress,
            email,
            phoneNum,
        });
        const result = await getManager().transaction((transactionalEntityManager) => {
            return transactionalEntityManager.save<ContactEntity>(bizData);
        });
        if (!result) {
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, "创建失败，请联系管理员");
        }
        return ResultData.ok(classToPlain(result));
    }

    // 一次性获取所有联系方式
    async findAllContact(): Promise<ResultData> {
        const bizData = await this.repo.findAndCount();
        return ResultData.ok({ list: bizData[0], total: bizData[1] });
    }

    async update(id: number, updateContactDto: UpdateContactDto): Promise<ResultData> {
        const contact = await this.repo.findOne(id);
        if (!contact) {
            return ResultData.fail(AppHttpCode.CONTACT_NOT_FOUND, "找不到当前联系方式");
        }
        const done = await this.repo.save({
            ...contact,
            ...updateContactDto,
        });
        if (done) {
            return ResultData.ok(classToPlain(done));
        }
        return ResultData.fail(AppHttpCode.SERVICE_ERROR, "更新失败，请联系管理员");
    }

    async createFeedback(feedback: CreateContactFeedbackDto): Promise<ResultData> {
        const { message, email, nickName } = feedback;
        const bizData = plainToClass(FeedbackEntity, {
            message,
            email,
            nickName,
        });
        const docs = await this.documentService.findOneDocumentValue({
            docKey: "addressee",
            source: "contact",
            type: "array",
        });
        const result = await getManager().transaction((transactionalEntityManager) => {
            return transactionalEntityManager.save<FeedbackEntity>(bizData);
        });
        if (!result) {
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, "对不起提交失败");
        }
        // 发送邮件
        const toEmails: string[] = getFeedbackAddressee(docs);
        const template: IMailTemplate = createMailTemplate({
            toEmails,
            message,
            nickName,
            email,
        });
        this.sendMail(template);
        return ResultData.ok(classToPlain(result));
    }

    async findAllFeedback(search: FindContactFeedbackDto): Promise<ResultData> {
        const { size, page } = search;
        const res = await this.feebbackRepo
            .createQueryBuilder("op_biz_feedback")
            .skip(page * size)
            .take(size)
            .getManyAndCount();
        return ResultData.ok({ list: res[0], total: res[1] });
    }
}

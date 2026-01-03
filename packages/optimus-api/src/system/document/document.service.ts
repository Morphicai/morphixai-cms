import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, getConnection, getManager, EntityManager } from "typeorm";

import { plainToClass, classToPlain } from "class-transformer";

import { createdocumentPermsInTransaction } from "./helps/createdocumentPermsInTransaction";
import { mergePerms } from "./helps/mergePerms";

import { ResultData } from "../../shared/utils/result";
import { AppHttpCode } from "../../shared/enums/code.enum";
import { UserType } from "../../shared/enums/user.enum";

import { CreateDocumentDto } from "./dto/create-document.dto";
import { FindDocumentDto } from "./dto/find-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { FindAllDocumentDto } from "./dto/find-all-document.dto";

import { DocumentEntity } from "./entities/document.entity";
import { DocumentPermEntity } from "./entities/document-perm.entity";

@Injectable()
export class DocumentService {
    constructor(
        @InjectRepository(DocumentEntity)
        private readonly docRepository: Repository<DocumentEntity>,
        @InjectRepository(DocumentPermEntity)
        private readonly docPermRepository: Repository<DocumentPermEntity>,
    ) {}

    /**
     * 创建一条新的文案中心
     * @param userId
     * @param documentParams CreateDocumentDto
     * @returns ResultData
     */
    async create(userId: string, documentParams: CreateDocumentDto): Promise<ResultData> {
        // 检查 docKey 是否已存在（唯一性验证）
        const existingByDocKey = await this.docRepository.findOne({
            where: { docKey: documentParams.docKey },
        });

        if (existingByDocKey) {
            return ResultData.fail(
                AppHttpCode.DOCUMENT_KEY_DUPLICATE,
                `文档标识符 "${documentParams.docKey}" 已存在，请使用其他标识符`,
            );
        }

        // 检查 docKey + source + type 组合是否已存在（原有逻辑）
        const { isExists } = await this.findOneDocumentValue(documentParams);
        if (isExists) {
            return ResultData.fail(AppHttpCode.DOCUMENT_ALREADY_EXISTS, "已经存在的文案中心值");
        }

        const bizData = plainToClass(DocumentEntity, {
            ...documentParams,
            userId,
        });

        const result = await getManager().transaction(async (transactionalEntityManager: EntityManager) => {
            const documentIns = await transactionalEntityManager.save<DocumentEntity>(bizData);
            await createdocumentPermsInTransaction(transactionalEntityManager, documentIns.id, documentParams);
            return documentIns;
        });

        if (result) {
            return ResultData.ok({}, "创建成功");
        }
        return ResultData.fail(AppHttpCode.DOCUMENT_CREATE_FAILD, "创建失败");
    }

    // 查找某一条文案中心
    async findOne(findDocumentDto: FindDocumentDto): Promise<ResultData> {
        const { isExists, value } = await this.findOneDocumentValue(findDocumentDto);

        if (isExists) {
            const { id, ..._value } = value;
            return ResultData.ok(_value);
        }
        return ResultData.fail(AppHttpCode.DOCUMENT_NOT_FOUND, "不存在的文案");
    }

    public async findOneDocumentValue(documentParams: FindDocumentDto): Promise<{ isExists: boolean; value: any }> {
        const { docKey, source, type } = documentParams;
        const docs = await this.docRepository.find({ where: { docKey, source, type } });
        return {
            isExists: Boolean(docs.length),
            value: classToPlain(docs)[0],
        };
    }

    async findAll(search: FindAllDocumentDto): Promise<ResultData> {
        const { size, page, docKey, source, type } = search;

        const where: any = {};
        docKey && (where.docKey = docKey);
        source && (where.source = source);
        type && (where.type = type);

        // 开启事务
        const result = await getManager().transaction(async (manager: EntityManager) => {
            const [list = [], count = 0] = await manager.findAndCount<DocumentEntity>(DocumentEntity, {
                skip: size * page,
                take: size,
                where,
            });

            for (const doc of list) {
                const perms: DocumentPermEntity[] = await manager.find<DocumentPermEntity>(DocumentPermEntity, {
                    documentId: doc.id,
                });

                doc.roleIdPerms = [];
                doc.accountIdPerms = [];

                perms.forEach((d) => {
                    if (d.roleId) {
                        doc.roleIdPerms.push(d.roleId);
                    } else if (d.userId) {
                        doc.accountIdPerms.push(d.userId);
                    }
                });
            }
            return [list, count];
        });

        return ResultData.ok({ list: classToPlain(result[0]), total: result[1] });
    }

    async findOneById(id: number): Promise<ResultData> {
        let doc = await this.docRepository.findOne({
            where: { id },
            select: ["id", "docKey", "showOnMenu", "source", "type", "content", "description"],
        });
        if (!doc) {
            return ResultData.fail(AppHttpCode.DOCUMENT_NOT_FOUND, "找不到对应的文案中心");
        }

        const perms: DocumentPermEntity[] = await this.docPermRepository.find({
            documentId: doc.id,
        });

        doc = mergePerms(doc, perms);
        return ResultData.ok(classToPlain(doc));
    }

    async findAllMenuDocuments(user): Promise<ResultData> {
        const isAdmin = UserType.SUPER_ADMIN === user.type;
        const { id, roleIds } = user as any;

        if (roleIds?.length === 0) {
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, "该账号无任何权限");
        }

        // 需要展示在菜单上的所有文案中心
        let result: any[] = await this.docRepository.find({
            where: { showOnMenu: 1 },
        });

        // 如果是管理员，就不需要处理权限数据，直接展示即可，以下是非管理身份
        if (!isAdmin && result.length > 0) {
            const docMenus = await getConnection()
                .createQueryBuilder()
                .select()
                .from("op_sys_document_perm", "dp")
                .leftJoinAndSelect("op_sys_document", "d", "dp.document_id = d.id")
                .having("d.show_on_menu = :status", { status: 1 })
                .where("dp.role_id IN (:...roleIds) OR dp.user_id = :userId", {
                    userId: id,
                    roleIds,
                })
                .groupBy("d.id")
                .getRawMany();

            // 如果查到了，说明文案中心ID：X 需要权限，反之X为任意访问权限
            if (docMenus.length) {
                result = docMenus.map(
                    ({ d_id, d_doc_key, d_show_on_menu, d_source, d_type, d_content, d_description }) => ({
                        id: d_id,
                        docKey: d_doc_key,
                        showOnMenu: d_show_on_menu,
                        source: d_source,
                        type: d_type,
                        content: d_content,
                        description: d_description,
                    }),
                );
            }
        }

        return ResultData.ok({ list: result, total: result.length });
    }

    async remove(id: number): Promise<ResultData> {
        const done = await getManager().transaction(async (manager) => {
            await manager.delete(DocumentEntity, { id });
            await manager.delete(DocumentPermEntity, { documentId: id });
            return true;
        });

        if (done) {
            return ResultData.ok({}, "删除成功");
        }
        return ResultData.fail(AppHttpCode.SERVICE_ERROR, "删除失败，请联系管理员");
    }

    async _update(id: number, docDto: UpdateDocumentDto): Promise<ResultData> {
        const doc = await this.docRepository.findOne(id);
        if (!doc) {
            return ResultData.fail(AppHttpCode.DOCUMENT_NOT_FOUND, "找不到当前的文案中心值");
        }
        const done = await this.docRepository.save({
            ...doc,
            ...docDto,
        });
        if (done) {
            return ResultData.ok(classToPlain(done));
        }
        return ResultData.fail(AppHttpCode.SERVICE_ERROR, "更新失败，请联系管理员");
    }

    async update(docDto: UpdateDocumentDto, id?: number): Promise<ResultData> {
        let docDtoFromDB: DocumentEntity;
        // 存在 ID 的情况下，根据 ID 去查找
        if (id) {
            if (!(docDtoFromDB = await this.docRepository.findOne(id))) {
                return ResultData.fail(AppHttpCode.DOCUMENT_NOT_FOUND, "找不到当前的文案中心值");
            }
        } else {
            const { docKey, source, type } = docDto;
            const { isExists, value } = await this.findOneDocumentValue({ docKey, source, type });
            docDtoFromDB = value;
            if (!isExists) {
                return ResultData.fail(AppHttpCode.DOCUMENT_NOT_FOUND, "找不到当前的文案中心值");
            }
        }
        // 开启事务
        const result = await getManager().transaction(async (manager: EntityManager) => {
            const documentIns = await manager.save<DocumentEntity>(
                plainToClass(DocumentEntity, {
                    ...docDtoFromDB,
                    ...docDto,
                }),
            );
            // 更新 sys_document_perm 表
            await createdocumentPermsInTransaction(manager, documentIns.id, docDto, true);
            return documentIns;
        });

        if (result) {
            return ResultData.ok(classToPlain(result));
        }
        return ResultData.fail(AppHttpCode.SERVICE_ERROR, "更新失败，请联系管理员");
    }

    /**
     * 根据文档标识获取公开文档
     * @param docKey 文档标识符
     * @returns ResultData
     */
    async getPublicDocumentByKey(docKey: string): Promise<ResultData> {
        const document = await this.docRepository.findOne({
            where: { docKey, isPublic: true },
        });

        if (!document) {
            return ResultData.fail(AppHttpCode.DOCUMENT_NOT_FOUND, "文档不存在或未公开");
        }

        return ResultData.ok(classToPlain(document));
    }

    /**
     * 检查文档标识符是否已存在
     * @param docKey 文档标识符
     * @param excludeId 排除的文档ID（用于更新时的检查）
     * @returns ResultData
     */
    async checkDocKeyExists(docKey: string, excludeId?: number): Promise<ResultData> {
        const where: any = { docKey };

        const document = await this.docRepository.findOne({ where });

        // 如果找到文档，且不是要排除的ID，则表示已存在
        if (document && (!excludeId || document.id !== excludeId)) {
            return ResultData.ok({ exists: true });
        }

        return ResultData.ok({ exists: false });
    }
}

import { EntityManager } from "typeorm";
import { plainToClass } from "class-transformer";
import { DocumentPermEntity } from "../entities/document-perm.entity";
import { UpdateDocumentDto } from "../dto/update-document.dto";
import { hasInObject } from "../../../shared/utils/utils";

export async function createdocumentPermsInTransaction(
    manager: EntityManager,
    documentId: number,
    params: UpdateDocumentDto,
    isUpdate = false,
) {
    const documentPerms: DocumentPermEntity[] = [];

    const hasAuthParams = (key) => {
        return hasInObject(params, key) && Array.isArray(params[key]);
    };
    if ((isUpdate && hasAuthParams("accountIdPerms")) || hasAuthParams("roleIdPerms")) {
        await manager.delete<DocumentPermEntity>(DocumentPermEntity, { documentId });
    }
    const { roleIdPerms = [], accountIdPerms = [] } = params;
    // 存在角色列表的情况
    if (roleIdPerms.length) {
        roleIdPerms.forEach((roleId) => documentPerms.push({ roleId, documentId }));
    }
    // 存在用户列表的情况
    if (accountIdPerms.length) {
        accountIdPerms.forEach((userId) => documentPerms.push({ userId, documentId }));
    }
    if (documentPerms.length) {
        return manager.save<DocumentPermEntity>(plainToClass(DocumentPermEntity, documentPerms));
    }
    return false;
}

import { DocumentEntity } from "../entities/document.entity";
import { DocumentPermEntity } from "../entities/document-perm.entity";

export function mergePerms(doc: DocumentEntity, perms: DocumentPermEntity[]) {
    doc.roleIdPerms = [];
    doc.accountIdPerms = [];

    perms.forEach((d) => {
        if (d.roleId) {
            doc?.roleIdPerms?.push(d.roleId);
        } else if (d.userId) {
            doc?.accountIdPerms?.push(d.userId);
        }
    });

    return doc;
}

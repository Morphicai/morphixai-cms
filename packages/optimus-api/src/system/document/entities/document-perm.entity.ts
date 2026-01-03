import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("op_sys_document_perm")
export class DocumentPermEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id?: number;

    @Column({ default: 0, type: "bigint", name: "user_id", comment: "用户id" })
    userId?: number;

    @Column({ default: 0, type: "bigint", name: "role_id", comment: "角色id" })
    roleId?: number;

    @Column({ type: "bigint", name: "document_id", comment: "文案中心id" })
    documentId: number;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("op_biz_partner_admin_log")
@Index(["partnerId"])
@Index(["adminId"])
export class AdminOperationLogEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string;

    @Column({ type: "bigint", name: "partner_id" })
    partnerId: string;

    @Column({ type: "varchar", length: 50, name: "operation_type" })
    operationType: string;

    @Column({ type: "varchar", length: 100, name: "admin_id" })
    adminId: string;

    @Column({ type: "text", nullable: true })
    reason: string | null;

    @Column({ type: "json", nullable: true, name: "before_data" })
    beforeData: any;

    @Column({ type: "json", nullable: true, name: "after_data" })
    afterData: any;

    @CreateDateColumn({ type: "timestamp", name: "created_at" })
    createdAt: Date;
}

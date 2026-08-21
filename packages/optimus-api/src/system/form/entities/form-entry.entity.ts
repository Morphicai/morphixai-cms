import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("op_sys_form_entry")
export class FormEntryEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string;

    @Column({ name: "form_id", type: "bigint" })
    formId: string;

    // 提交时刻的定义版本——历史数据永远按提交当时的表单结构解释,定义改了也不迁移
    @Column({ name: "schema_version", type: "int" })
    schemaVersion: number;

    @Column({ name: "data_json", type: "json" })
    dataJson: Record<string, unknown>;

    @Column({ name: "source_ip", length: 64, nullable: true })
    sourceIp: string | null;

    @CreateDateColumn({ name: "create_date", type: "timestamp" })
    createDate: Date;
}

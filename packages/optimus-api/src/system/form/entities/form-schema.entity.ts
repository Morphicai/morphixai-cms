import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("op_sys_form_schema")
export class FormSchemaEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 64, unique: true })
    slug: string;

    @Column({ name: "schema_json", type: "json" })
    schemaJson: Record<string, unknown>;

    @Column({ type: "tinyint", default: 0 })
    enabled: number;

    @Column({ name: "schema_version", type: "int", default: 1 })
    schemaVersion: number;

    @CreateDateColumn({ name: "create_date", type: "timestamp" })
    createDate: Date;

    @UpdateDateColumn({ name: "update_date", type: "timestamp" })
    updateDate: Date;
}

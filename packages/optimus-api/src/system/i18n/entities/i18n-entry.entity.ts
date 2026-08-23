import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * 多语言键值。translations 里出现什么 locale 就支持什么 locale——
 * 刻意不建语言注册表,加语言就是 json 里多一个键。
 * namespace 也不单独建表:它只是这里的一个列,"建 namespace"=建第一个 key。
 */
@Entity("op_sys_i18n_entry")
@Index(["namespace", "key"], { unique: true })
export class I18nEntryEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string;

    @Index()
    @Column({ length: 64 })
    namespace: string;

    @Column({ length: 128 })
    key: string;

    /** { "zh-CN": "...", "en-US": "..." }。zh-CN 是回退源语言 */
    @Column({ type: "json" })
    translations: Record<string, string>;

    /** 给译者(或翻译模型)的上下文备注 */
    @Column({ length: 255, nullable: true })
    remark: string | null;

    @CreateDateColumn({ name: "create_date", type: "timestamp" })
    createDate: Date;

    @UpdateDateColumn({ name: "update_date", type: "timestamp" })
    updateDate: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { ArticleEntity } from "./article.entity";

@Entity("sys_article_operation_log")
export class ArticleOperationLogEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @Column({ type: "bigint", name: "article_id", comment: "文章ID" })
    public articleId: number;

    @Column({ type: "varchar", length: 50, comment: "操作类型" })
    public operationType: string;

    @Column({ type: "text", nullable: true, comment: "操作描述" })
    public description: string;

    @Column({ type: "json", nullable: true, comment: "操作前数据" })
    public beforeData: Record<string, any>;

    @Column({ type: "json", nullable: true, comment: "操作后数据" })
    public afterData: Record<string, any>;

    @Column({ type: "varchar", length: 50, name: "user_id", comment: "操作用户ID" })
    public userId: string;

    @Column({ type: "varchar", length: 20, default: "success", comment: "操作状态: success, failed" })
    public status: string;

    @Column({ type: "text", nullable: true, comment: "错误信息" })
    public errorMessage: string;

    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "操作时间" })
    createDate: Date;

    @ManyToOne(() => ArticleEntity)
    @JoinColumn({ name: "article_id" })
    public article: ArticleEntity;
}

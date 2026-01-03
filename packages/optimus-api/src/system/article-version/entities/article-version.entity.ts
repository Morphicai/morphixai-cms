import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    Index,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { ArticleEntity } from "../../article/entities/article.entity";

@Entity("op_sys_article_version")
@Unique("uk_article_version", ["articleId", "versionNumber"])
@Index("idx_article_id", ["articleId"])
@Index("idx_status", ["status"])
@Index("idx_is_current", ["isCurrent"])
@Index("idx_create_date", ["createDate"])
export class ArticleVersionEntity {
    @ApiProperty({ description: "版本ID" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @ApiProperty({ description: "文章ID" })
    @Column({ type: "bigint", name: "article_id", comment: "文章ID" })
    public articleId: number;

    @ApiProperty({ description: "版本号" })
    @Column({ type: "int", name: "version_number", comment: "版本号" })
    public versionNumber: number;

    @ApiProperty({ description: "文章标题" })
    @Column({ type: "varchar", length: 200, comment: "文章标题" })
    public title: string;

    @ApiProperty({ description: "文章摘要" })
    @Column({ type: "text", nullable: true, comment: "文章摘要" })
    public summary: string | null;

    @ApiProperty({ description: "文章内容(HTML格式)" })
    @Column({ type: "longtext", comment: "文章内容(HTML格式)" })
    public content: string;

    @ApiProperty({ description: "封面图片数组" })
    @Column({ type: "json", nullable: true, name: "cover_images", comment: "封面图片数组" })
    public coverImages: string[];

    @ApiProperty({ description: "排序权重，数值越大越靠前" })
    @Column({ type: "int", default: 0, name: "sort_weight", comment: "排序权重，数值越大越靠前" })
    public sortWeight: number;

    @ApiProperty({ description: "SEO标题" })
    @Column({ type: "varchar", length: 200, nullable: true, name: "seo_title", comment: "SEO标题" })
    public seoTitle: string;

    @ApiProperty({ description: "SEO描述" })
    @Column({ type: "text", nullable: true, name: "seo_description", comment: "SEO描述" })
    public seoDescription: string;

    @ApiProperty({ description: "SEO关键词" })
    @Column({ type: "varchar", length: 500, nullable: true, name: "seo_keywords", comment: "SEO关键词" })
    public seoKeywords: string;

    @ApiProperty({ description: "版本状态" })
    @Column({ type: "enum", enum: ["draft", "published", "archived"], comment: "版本状态" })
    public status: string;

    @ApiProperty({ description: "是否为当前版本" })
    @Column({ type: "boolean", default: false, name: "is_current", comment: "是否为当前版本" })
    public isCurrent: boolean;

    @ApiProperty({ description: "版本创建者ID" })
    @Column({ type: "varchar", name: "user_id", comment: "版本创建者ID" })
    public userId: string;

    @ApiProperty({ description: "版本创建时间" })
    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "版本创建时间" })
    createDate: Date;

    // 关联关系
    @ManyToOne(() => ArticleEntity, (article) => article.versions)
    @JoinColumn({ name: "article_id" })
    public article: ArticleEntity;
}

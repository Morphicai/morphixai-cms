import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { CategoryEntity } from "../../category/entities/category.entity";
import { ArticleVersionEntity } from "../../article-version/entities/article-version.entity";

@Entity("sys_article")
export class ArticleEntity {
    @ApiProperty({ description: "文章ID" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @ApiProperty({ description: "URL友好的标识符" })
    @Column({ type: "varchar", length: 200, unique: true, nullable: true, comment: "URL友好的标识符" })
    public slug: string | null;

    @ApiProperty({ description: "当前发布状态" })
    @Column({ type: "enum", enum: ["draft", "published", "archived"], default: "draft", comment: "当前发布状态" })
    public status: string;

    @ApiProperty({ description: "预定发布时间" })
    @Column({ type: "timestamp", nullable: true, name: "scheduled_at", comment: "预定发布时间" })
    public scheduledAt: Date;

    @ApiProperty({ description: "实际发布时间" })
    @Column({ type: "timestamp", nullable: true, name: "published_at", comment: "实际发布时间" })
    public publishedAt: Date;

    @ApiProperty({ description: "当前版本ID" })
    @Column({ type: "bigint", nullable: true, name: "current_version_id", comment: "当前版本ID" })
    public currentVersionId: number;

    @ApiProperty({ description: "已发布版本ID" })
    @Column({ type: "bigint", nullable: true, name: "published_version_id", comment: "已发布版本ID" })
    public publishedVersionId: number;

    @ApiProperty({ description: "分类ID" })
    @Column({ type: "bigint", name: "category_id", comment: "分类ID" })
    public categoryId: number;

    @ApiProperty({ description: "创建者ID" })
    @Column({ type: "varchar", name: "user_id", comment: "创建者ID" })
    public userId: string;

    @ApiProperty({ description: "是否已删除" })
    @Column({ type: "boolean", default: false, name: "is_deleted", comment: "是否已删除（软删除标记）" })
    public isDeleted: boolean;

    @ApiProperty({ description: "删除时间" })
    @Column({ type: "timestamp", nullable: true, name: "deleted_at", comment: "删除时间" })
    public deletedAt: Date;

    @ApiProperty({ description: "删除者ID" })
    @Column({ type: "varchar", nullable: true, name: "deleted_by", comment: "删除者ID" })
    public deletedBy: string;

    @ApiProperty({ description: "创建时间" })
    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "创建时间" })
    createDate: Date;

    @ApiProperty({ description: "更新时间" })
    @UpdateDateColumn({ type: "timestamp", name: "update_date", comment: "更新时间" })
    updateDate: Date;

    // 关联关系
    @ManyToOne(() => CategoryEntity)
    @JoinColumn({ name: "category_id" })
    public category: CategoryEntity;

    @OneToMany(() => ArticleVersionEntity, (version) => version.article)
    public versions: ArticleVersionEntity[];

    @ManyToOne(() => ArticleVersionEntity)
    @JoinColumn({ name: "current_version_id" })
    public currentVersion: ArticleVersionEntity;

    @ManyToOne(() => ArticleVersionEntity)
    @JoinColumn({ name: "published_version_id" })
    public publishedVersion: ArticleVersionEntity;
}

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
import { ArticleEntity } from "../../article/entities/article.entity";

@Entity("sys_category")
export class CategoryEntity {
    @ApiProperty({ description: "分类ID" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @ApiProperty({ description: "分类名称" })
    @Column({ type: "varchar", length: 100, comment: "分类名称" })
    public name: string;

    @ApiProperty({ description: "分类标识符" })
    @Column({ type: "varchar", length: 100, unique: true, comment: "分类标识符" })
    public code: string;

    @ApiProperty({ description: "分类描述" })
    @Column({ type: "text", nullable: true, comment: "分类描述" })
    public description: string;

    @ApiProperty({ description: "分类配置(JSON格式)" })
    @Column({ type: "json", nullable: true, comment: "分类配置(JSON格式)" })
    public config: Record<string, any>;

    @ApiProperty({ description: "是否为内置分类" })
    @Column({ type: "boolean", default: false, name: "is_built_in", comment: "是否为内置分类" })
    public isBuiltIn: boolean;

    @ApiProperty({ description: "排序权重" })
    @Column({ type: "int", default: 0, name: "sort_weight", comment: "排序权重" })
    public sortWeight: number;

    @ApiProperty({ description: "父分类ID" })
    @Column({ type: "bigint", nullable: true, name: "parent_id", comment: "父分类ID" })
    public parentId: number;

    @ApiProperty({ description: "创建时间" })
    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "创建时间" })
    createDate: Date;

    @ApiProperty({ description: "更新时间" })
    @UpdateDateColumn({ type: "timestamp", name: "update_date", comment: "更新时间" })
    updateDate: Date;

    // 自关联关系
    @ManyToOne(() => CategoryEntity, { nullable: true })
    @JoinColumn({ name: "parent_id" })
    public parent: CategoryEntity;

    @OneToMany(() => CategoryEntity, (category) => category.parent)
    public children: CategoryEntity[];

    @OneToMany(() => ArticleEntity, (article) => article.category)
    public articles: ArticleEntity[];
}

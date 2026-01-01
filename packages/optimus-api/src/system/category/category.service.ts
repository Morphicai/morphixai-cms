import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, TreeRepository, IsNull, Like } from "typeorm";
import { CategoryEntity } from "./entities/category.entity";
import { CreateCategoryDto, UpdateCategoryDto, FindAllCategoryDto } from "./dto";
import { ArticleHttpCode } from "../article/enums/article-http-code.enum";

@Injectable()
export class CategoryService {
    private readonly logger = new Logger(CategoryService.name);

    constructor(
        @InjectRepository(CategoryEntity)
        private readonly categoryRepository: Repository<CategoryEntity>,
    ) {}

    /**
     * 创建分类
     */
    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
        try {
            // 检查分类代码是否已存在
            const existingCategory = await this.categoryRepository.findOne({
                where: { code: createCategoryDto.code },
            });

            if (existingCategory) {
                throw new ConflictException({
                    code: ArticleHttpCode.CATEGORY_ALREADY_EXISTS,
                    message: `分类代码 '${createCategoryDto.code}' 已存在`,
                });
            }

            // 如果指定了父分类，验证父分类是否存在
            if (createCategoryDto.parentId) {
                const parentCategory = await this.categoryRepository.findOne({
                    where: { id: createCategoryDto.parentId },
                });

                if (!parentCategory) {
                    throw new NotFoundException({
                        code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                        message: `父分类 ID ${createCategoryDto.parentId} 不存在`,
                    });
                }
            }

            // 验证分类配置
            this.validateCategoryConfig(createCategoryDto.config);

            // 创建分类
            const category = this.categoryRepository.create({
                ...createCategoryDto,
                isBuiltIn: false, // 通过API创建的分类都不是内置分类
            });

            const savedCategory = await this.categoryRepository.save(category);
            this.logger.log(`Created category: ${savedCategory.name} (${savedCategory.code})`);

            return savedCategory;
        } catch (error) {
            if (
                error instanceof ConflictException ||
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            this.logger.error(`Failed to create category: ${error.message}`, error.stack);
            throw new BadRequestException({
                code: ArticleHttpCode.CATEGORY_CREATE_FAILED,
                message: "创建分类失败",
            });
        }
    }

    /**
     * 查询分类列表
     */
    async findAll(query: FindAllCategoryDto = {}): Promise<{ categories: CategoryEntity[]; total: number }> {
        try {
            const { isBuiltIn, parentId, name, tree = true, page = 1, limit = 20 } = query;

            // 构建查询条件
            const where: any = {};
            if (isBuiltIn !== undefined) {
                where.isBuiltIn = isBuiltIn;
            }
            if (parentId !== undefined) {
                where.parentId = parentId;
            }
            if (name) {
                where.name = Like(`%${name}%`);
            }

            if (tree) {
                // 返回树形结构 - 需要加载所有分类及其关系
                const allCategories = await this.categoryRepository.find({
                    where,
                    order: { sortWeight: "DESC", createDate: "ASC" },
                });

                // 构建树形结构
                const treeCategories = this.buildCategoryTree(allCategories);
                return { categories: treeCategories, total: allCategories.length };
            } else {
                // 返回分页列表
                const [categories, total] = await this.categoryRepository.findAndCount({
                    where,
                    relations: ["parent"],
                    order: { sortWeight: "DESC", createDate: "ASC" },
                    skip: (page - 1) * limit,
                    take: limit,
                });

                return { categories, total };
            }
        } catch (error) {
            this.logger.error(`Failed to find categories: ${error.message}`, error.stack);
            throw new BadRequestException("查询分类列表失败");
        }
    }

    /**
     * 根据ID查询分类详情
     */
    async findOne(id: number): Promise<CategoryEntity> {
        try {
            const category = await this.categoryRepository.findOne({
                where: { id },
                relations: ["parent", "children", "articles"],
            });

            if (!category) {
                throw new NotFoundException({
                    code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                    message: `分类 ID ${id} 不存在`,
                });
            }

            return category;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find category ${id}: ${error.message}`, error.stack);
            throw new BadRequestException("查询分类详情失败");
        }
    }

    /**
     * 根据代码查询分类
     */
    async findByCode(code: string): Promise<CategoryEntity> {
        try {
            const category = await this.categoryRepository.findOne({
                where: { code },
                relations: ["parent", "children"],
            });

            if (!category) {
                throw new NotFoundException({
                    code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                    message: `分类代码 '${code}' 不存在`,
                });
            }

            return category;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find category by code ${code}: ${error.message}`, error.stack);
            throw new BadRequestException("查询分类失败");
        }
    }

    /**
     * 更新分类
     */
    async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<CategoryEntity> {
        try {
            const category = await this.findOne(id);

            // 检查是否为内置分类
            if (category.isBuiltIn) {
                // 内置分类只能更新配置和描述
                const allowedFields = ["description", "config", "sortWeight"];
                const updateFields = Object.keys(updateCategoryDto);
                const invalidFields = updateFields.filter((field) => !allowedFields.includes(field));

                if (invalidFields.length > 0) {
                    throw new BadRequestException({
                        code: ArticleHttpCode.BUILT_IN_CATEGORY_CANNOT_DELETE,
                        message: `内置分类不能修改字段: ${invalidFields.join(", ")}`,
                    });
                }
            }

            // 如果更新父分类，验证父分类是否存在且不会形成循环引用
            if (updateCategoryDto.parentId !== undefined) {
                if (updateCategoryDto.parentId === id) {
                    throw new BadRequestException({
                        code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                        message: "分类不能设置自己为父分类",
                    });
                }

                if (updateCategoryDto.parentId) {
                    const parentCategory = await this.categoryRepository.findOne({
                        where: { id: updateCategoryDto.parentId },
                    });

                    if (!parentCategory) {
                        throw new NotFoundException({
                            code: ArticleHttpCode.CATEGORY_NOT_FOUND,
                            message: `父分类 ID ${updateCategoryDto.parentId} 不存在`,
                        });
                    }

                    // 检查是否会形成循环引用
                    if (await this.wouldCreateCircularReference(id, updateCategoryDto.parentId)) {
                        throw new BadRequestException({
                            code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                            message: "不能设置子分类为父分类，这会形成循环引用",
                        });
                    }
                }
            }

            // 验证分类配置
            if (updateCategoryDto.config) {
                this.validateCategoryConfig(updateCategoryDto.config);
            }

            // 更新分类
            const updateData: any = { ...updateCategoryDto };
            await this.categoryRepository.update(id, updateData);
            const updatedCategory = await this.findOne(id);

            this.logger.log(`Updated category: ${updatedCategory.name} (${updatedCategory.code})`);
            return updatedCategory;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to update category ${id}: ${error.message}`, error.stack);
            throw new BadRequestException({
                code: ArticleHttpCode.CATEGORY_UPDATE_FAILED,
                message: "更新分类失败",
            });
        }
    }

    /**
     * 删除分类
     */
    async remove(id: number): Promise<void> {
        try {
            const category = await this.findOne(id);

            // 检查是否为内置分类
            if (category.isBuiltIn) {
                throw new BadRequestException({
                    code: ArticleHttpCode.BUILT_IN_CATEGORY_CANNOT_DELETE,
                    message: "内置分类不能删除",
                });
            }

            // 检查是否有关联的文章
            if (category.articles && category.articles.length > 0) {
                throw new BadRequestException({
                    code: ArticleHttpCode.CATEGORY_HAS_ARTICLES,
                    message: `分类 '${category.name}' 下还有 ${category.articles.length} 篇文章，不能删除`,
                });
            }

            // 检查是否有子分类
            if (category.children && category.children.length > 0) {
                throw new BadRequestException({
                    code: ArticleHttpCode.CATEGORY_HAS_ARTICLES,
                    message: `分类 '${category.name}' 下还有 ${category.children.length} 个子分类，不能删除`,
                });
            }

            await this.categoryRepository.delete(id);
            this.logger.log(`Deleted category: ${category.name} (${category.code})`);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Failed to delete category ${id}: ${error.message}`, error.stack);
            throw new BadRequestException({
                code: ArticleHttpCode.CATEGORY_DELETE_FAILED,
                message: "删除分类失败",
            });
        }
    }

    /**
     * 获取内置分类
     */
    async getBuiltInCategories(): Promise<CategoryEntity[]> {
        try {
            return await this.categoryRepository.find({
                where: { isBuiltIn: true },
                order: { sortWeight: "DESC", createDate: "ASC" },
            });
        } catch (error) {
            this.logger.error(`Failed to get built-in categories: ${error.message}`, error.stack);
            throw new BadRequestException("获取内置分类失败");
        }
    }

    /**
     * 验证分类配置
     */
    private validateCategoryConfig(config: any): void {
        if (!config) return;

        // 验证 maxCoverImages
        if (config.maxCoverImages !== undefined) {
            if (typeof config.maxCoverImages !== "number" || config.maxCoverImages < 1 || config.maxCoverImages > 10) {
                throw new BadRequestException({
                    code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                    message: "maxCoverImages 必须是1-10之间的数字",
                });
            }
        }

        // 验证 maxVersions
        if (config.maxVersions !== undefined) {
            if (typeof config.maxVersions !== "number" || config.maxVersions < 1 || config.maxVersions > 50) {
                throw new BadRequestException({
                    code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                    message: "maxVersions 必须是1-50之间的数字",
                });
            }
        }

        // 验证封面配置
        if (config.coverConfig) {
            this.validateCoverConfig(config.coverConfig);
        }

        // 检查是否有未知的配置项
        const allowedKeys = ["maxCoverImages", "maxVersions", "coverConfig"];
        const unknownKeys = Object.keys(config).filter((key) => !allowedKeys.includes(key));
        if (unknownKeys.length > 0) {
            throw new BadRequestException({
                code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                message: `未知的配置项: ${unknownKeys.join(", ")}`,
            });
        }
    }

    /**
     * 验证封面配置
     */
    private validateCoverConfig(coverConfig: any): void {
        if (!coverConfig || !coverConfig.resolutionType) return;

        const { resolutionType, width, height, aspectRatio, allowedResolutions, aspectRatioTolerance } = coverConfig;

        switch (resolutionType) {
            case "width_only":
                if (!width || width <= 0) {
                    throw new BadRequestException({
                        code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                        message: "width_only 类型必须指定有效的 width",
                    });
                }
                break;

            case "height_only":
                if (!height || height <= 0) {
                    throw new BadRequestException({
                        code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                        message: "height_only 类型必须指定有效的 height",
                    });
                }
                break;

            case "aspect_ratio":
                if (!aspectRatio || aspectRatio <= 0) {
                    throw new BadRequestException({
                        code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                        message: "aspect_ratio 类型必须指定有效的 aspectRatio",
                    });
                }
                if (aspectRatioTolerance !== undefined && (aspectRatioTolerance < 0 || aspectRatioTolerance > 1)) {
                    throw new BadRequestException({
                        code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                        message: "aspectRatioTolerance 必须在 0-1 之间",
                    });
                }
                break;

            case "max_size":
                if ((!width || width <= 0) && (!height || height <= 0)) {
                    throw new BadRequestException({
                        code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                        message: "max_size 类型必须指定 width 或 height 至少一个",
                    });
                }
                break;

            case "exact_sizes":
                if (!allowedResolutions || !Array.isArray(allowedResolutions) || allowedResolutions.length === 0) {
                    throw new BadRequestException({
                        code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                        message: "exact_sizes 类型必须指定 allowedResolutions 数组",
                    });
                }
                // 验证每个分辨率
                allowedResolutions.forEach((resolution, index) => {
                    if (!resolution.width || !resolution.height || resolution.width <= 0 || resolution.height <= 0) {
                        throw new BadRequestException({
                            code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                            message: `allowedResolutions[${index}] 必须同时指定有效的 width 和 height`,
                        });
                    }
                });
                break;

            default:
                throw new BadRequestException({
                    code: ArticleHttpCode.INVALID_CATEGORY_CONFIG,
                    message: `不支持的分辨率限制类型: ${resolutionType}`,
                });
        }
    }

    /**
     * 检查是否会形成循环引用
     */
    private async wouldCreateCircularReference(categoryId: number, parentId: number): Promise<boolean> {
        let currentParentId = parentId;
        const visited = new Set<number>();

        while (currentParentId) {
            if (visited.has(currentParentId)) {
                // 已经访问过，说明存在循环
                return true;
            }

            if (currentParentId === categoryId) {
                // 找到了目标分类，说明会形成循环
                return true;
            }

            visited.add(currentParentId);

            const parent = await this.categoryRepository.findOne({
                where: { id: currentParentId },
                select: ["id", "parentId"],
            });

            if (!parent) {
                break;
            }

            currentParentId = parent.parentId;
        }

        return false;
    }

    /**
     * 构建分类树形结构
     */
    private buildCategoryTree(categories: CategoryEntity[]): CategoryEntity[] {
        if (!categories || categories.length === 0) {
            return [];
        }

        const categoryMap = new Map<number, any>();
        const rootCategories: any[] = [];

        // 第一步：创建所有节点的副本，并初始化 children 数组
        categories.forEach((category) => {
            categoryMap.set(category.id, {
                ...category,
                children: [],
            });
        });

        // 第二步：构建父子关系
        categories.forEach((category) => {
            const categoryNode = categoryMap.get(category.id);

            if (category.parentId && category.parentId !== null) {
                // 有父分类，添加到父分类的 children 中
                const parent = categoryMap.get(category.parentId);
                if (parent) {
                    if (!parent.children) {
                        parent.children = [];
                    }
                    parent.children.push(categoryNode);
                } else {
                    // 父分类不在当前结果集中，作为根节点处理
                    rootCategories.push(categoryNode);
                }
            } else {
                // 没有父分类，是根节点
                rootCategories.push(categoryNode);
            }
        });

        // 清理空的 children 数组（可选，保持数据整洁）
        const cleanEmptyChildren = (nodes: any[]) => {
            nodes.forEach((node) => {
                if (node.children && node.children.length === 0) {
                    delete node.children;
                } else if (node.children && node.children.length > 0) {
                    cleanEmptyChildren(node.children);
                }
            });
        };
        cleanEmptyChildren(rootCategories);

        return rootCategories;
    }

    /**
     * 获取分类的配置信息
     */
    async getCategoryConfig(categoryId: number): Promise<any> {
        const category = await this.findOne(categoryId);
        return category.config || {};
    }

    /**
     * 验证文章是否符合分类配置要求
     */
    async validateArticleAgainstCategory(
        categoryId: number,
        articleData: { coverImages?: string[]; coverImageDimensions?: Array<{ width: number; height: number }> },
    ): Promise<void> {
        const config = await this.getCategoryConfig(categoryId);

        // 验证封面图片数量
        if (config.maxCoverImages && articleData.coverImages) {
            if (articleData.coverImages.length > config.maxCoverImages) {
                throw new BadRequestException({
                    code: ArticleHttpCode.COVER_IMAGES_EXCEED_LIMIT,
                    message: `封面图片数量不能超过 ${config.maxCoverImages} 张`,
                });
            }
        }

        // 验证封面图片分辨率
        if (config.coverConfig && articleData.coverImageDimensions) {
            this.validateCoverImageDimensions(config.coverConfig, articleData.coverImageDimensions);
        }
    }

    /**
     * 验证封面图片分辨率
     */
    private validateCoverImageDimensions(coverConfig: any, dimensions: Array<{ width: number; height: number }>): void {
        if (!coverConfig || !coverConfig.resolutionType || !dimensions || dimensions.length === 0) {
            return;
        }

        const {
            resolutionType,
            width,
            height,
            aspectRatio,
            allowedResolutions,
            aspectRatioTolerance = 0.01,
        } = coverConfig;

        dimensions.forEach((dim, index) => {
            const imageAspectRatio = dim.width / dim.height;

            switch (resolutionType) {
                case "width_only":
                    if (dim.width !== width) {
                        throw new BadRequestException({
                            code: ArticleHttpCode.INVALID_COVER_IMAGE_RESOLUTION,
                            message: `封面图片 ${index + 1} 宽度必须为 ${width}px，当前为 ${dim.width}px`,
                        });
                    }
                    break;

                case "height_only":
                    if (dim.height !== height) {
                        throw new BadRequestException({
                            code: ArticleHttpCode.INVALID_COVER_IMAGE_RESOLUTION,
                            message: `封面图片 ${index + 1} 高度必须为 ${height}px，当前为 ${dim.height}px`,
                        });
                    }
                    break;

                case "aspect_ratio":
                    const diff = Math.abs(imageAspectRatio - aspectRatio);
                    if (diff > aspectRatioTolerance) {
                        throw new BadRequestException({
                            code: ArticleHttpCode.INVALID_COVER_IMAGE_RESOLUTION,
                            message: `封面图片 ${index + 1} 宽高比必须为 ${aspectRatio.toFixed(
                                2,
                            )}（容差 ${aspectRatioTolerance}），当前为 ${imageAspectRatio.toFixed(2)}`,
                        });
                    }
                    break;

                case "max_size":
                    if ((width && dim.width > width) || (height && dim.height > height)) {
                        throw new BadRequestException({
                            code: ArticleHttpCode.INVALID_COVER_IMAGE_RESOLUTION,
                            message: `封面图片 ${index + 1} 尺寸超出限制（最大 ${width || "无限制"}x${
                                height || "无限制"
                            }px），当前为 ${dim.width}x${dim.height}px`,
                        });
                    }
                    break;

                case "exact_sizes":
                    const isAllowed = allowedResolutions.some(
                        (allowed: any) => allowed.width === dim.width && allowed.height === dim.height,
                    );
                    if (!isAllowed) {
                        const allowedStr = allowedResolutions.map((r: any) => `${r.width}x${r.height}`).join(", ");
                        throw new BadRequestException({
                            code: ArticleHttpCode.INVALID_COVER_IMAGE_RESOLUTION,
                            message: `封面图片 ${index + 1} 分辨率必须为以下之一：${allowedStr}，当前为 ${dim.width}x${
                                dim.height
                            }px`,
                        });
                    }
                    break;
            }
        });
    }
}

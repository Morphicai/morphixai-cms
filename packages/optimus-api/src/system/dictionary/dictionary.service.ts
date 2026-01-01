import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DictionaryEntity, DictionaryStatus } from "./entities/dictionary.entity";
import { DictionaryCollectionEntity } from "./entities/dictionary-collection.entity";
import {
    CreateDictionaryDto,
    UpdateDictionaryDto,
    QueryDictionaryDto,
    DictionaryInfoDto,
    DictionaryListResponseDto,
    DictionaryCollectionResponseDto,
} from "./dto/dictionary.dto";

/**
 * 字典服务
 */
@Injectable()
export class DictionaryService {
    private readonly logger = new Logger(DictionaryService.name);

    constructor(
        @InjectRepository(DictionaryEntity)
        private readonly dictionaryRepository: Repository<DictionaryEntity>,
        @InjectRepository(DictionaryCollectionEntity)
        private readonly collectionRepository: Repository<DictionaryCollectionEntity>,
    ) {}

    /**
     * 创建字典
     */
    async create(dto: CreateDictionaryDto): Promise<DictionaryInfoDto> {
        // 检查集合是否存在
        const collection = await this.getCollectionEntity(dto.collection);

        // 验证数据是否符合 Schema（包括唯一性验证）
        await this.validateSchema(collection, dto.value);

        // 检查是否已存在
        const existing = await this.dictionaryRepository.findOne({
            where: { collection: dto.collection, key: dto.key },
        });

        if (existing) {
            throw new BadRequestException(`字典项已存在: ${dto.collection}.${dto.key}`);
        }

        // 检查集合条目数限制
        await this.checkMaxItems(dto.collection);

        const dictionary = this.dictionaryRepository.create(dto);
        const saved = await this.dictionaryRepository.save(dictionary);

        this.logger.log(`创建字典: ${dto.collection}.${dto.key}`);

        return this.toDto(saved);
    }

    /**
     * 更新字典
     */
    async update(id: number, dto: UpdateDictionaryDto): Promise<DictionaryInfoDto> {
        const dictionary = await this.dictionaryRepository.findOne({ where: { id } });

        if (!dictionary) {
            throw new NotFoundException("字典项不存在");
        }

        // 如果更新了值，验证是否符合 Schema（包括唯一性验证）
        if (dto.value !== undefined) {
            const collection = await this.getCollectionEntity(dictionary.collection);
            await this.validateSchema(collection, dto.value, id);
        }

        Object.assign(dictionary, dto);
        const saved = await this.dictionaryRepository.save(dictionary);

        this.logger.log(`更新字典: ${dictionary.collection}.${dictionary.key}`);

        return this.toDto(saved);
    }

    /**
     * 删除字典
     */
    async delete(id: number): Promise<void> {
        const dictionary = await this.dictionaryRepository.findOne({ where: { id } });

        if (!dictionary) {
            throw new NotFoundException("字典项不存在");
        }

        await this.dictionaryRepository.delete(id);

        this.logger.log(`删除字典: ${dictionary.collection}.${dictionary.key}`);
    }

    /**
     * 查询字典列表
     */
    async findAll(dto: QueryDictionaryDto): Promise<DictionaryListResponseDto> {
        const { collection, key, status, page = 1, pageSize = 20 } = dto;

        const queryBuilder = this.dictionaryRepository.createQueryBuilder("dictionary");

        if (collection) {
            queryBuilder.andWhere("dictionary.collection = :collection", { collection });
        }

        if (key) {
            queryBuilder.andWhere("dictionary.key LIKE :key", { key: `%${key}%` });
        }

        if (status) {
            queryBuilder.andWhere("dictionary.status = :status", { status });
        }

        queryBuilder.orderBy("dictionary.collection", "ASC");
        queryBuilder.addOrderBy("dictionary.sortOrder", "ASC");
        queryBuilder.addOrderBy("dictionary.id", "ASC");

        const skip = (page - 1) * pageSize;
        queryBuilder.skip(skip).take(pageSize);

        const [items, total] = await queryBuilder.getManyAndCount();

        return {
            items: items.map((item) => this.toDto(item)),
            total,
            page,
            pageSize,
        };
    }

    /**
     * 按集合获取字典
     */
    async findByCollection(collection: string): Promise<DictionaryCollectionResponseDto> {
        const items = await this.dictionaryRepository.find({
            where: { collection, status: DictionaryStatus.ACTIVE },
            order: { sortOrder: "ASC", id: "ASC" },
        });

        return {
            collection,
            items: items.map((item) => ({
                key: item.key,
                value: { ...item.value, _key: item.key },
                sortOrder: item.sortOrder,
            })),
            total: items.length,
        };
    }

    /**
     * 按集合和键获取字典值
     */
    async getValue(collection: string, key: string): Promise<any> {
        const dictionary = await this.dictionaryRepository.findOne({
            where: { collection, key, status: DictionaryStatus.ACTIVE },
        });

        if (!dictionary) {
            throw new NotFoundException(`字典项不存在: ${collection}.${key}`);
        }

        return { ...dictionary.value, _key: key };
    }

    /**
     * 获取集合实体
     */
    private async getCollectionEntity(collection: string): Promise<DictionaryCollectionEntity> {
        const entity = await this.collectionRepository.findOne({
            where: { name: collection },
        });

        if (!entity) {
            throw new NotFoundException(`集合不存在: ${collection}`);
        }

        return entity;
    }

    /**
     * 检查集合是否存在
     */
    private async checkCollectionExists(collection: string): Promise<void> {
        await this.getCollectionEntity(collection);
    }

    /**
     * 验证数据是否符合 Schema
     */
    private async validateSchema(
        collection: DictionaryCollectionEntity,
        value: any,
        currentId?: number,
    ): Promise<void> {
        // 如果集合没有定义 Schema，跳过验证
        if (!collection.schema) {
            return;
        }

        try {
            // 使用简单的类型验证
            const schema = collection.schema;

            // 验证必填字段
            if (schema.required && Array.isArray(schema.required)) {
                for (const field of schema.required) {
                    if (value[field] === undefined || value[field] === null) {
                        throw new BadRequestException(`缺少必填字段: ${field}`);
                    }
                }
            }

            // 验证字段类型和唯一性
            if (schema.properties) {
                for (const [field, fieldSchema] of Object.entries(schema.properties as any)) {
                    // 验证字段名格式（不能以数字或下划线开头）
                    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field)) {
                        throw new BadRequestException(
                            `字段名 "${field}" 格式错误，必须以字母开头，只能包含字母、数字和下划线`,
                        );
                    }

                    if (value[field] !== undefined) {
                        const fieldValue = value[field];
                        const expectedType = (fieldSchema as any).type;

                        // 验证类型
                        if (!this.validateFieldType(fieldValue, expectedType)) {
                            throw new BadRequestException(
                                `字段 ${field} 类型错误，期望 ${expectedType}，实际 ${typeof fieldValue}`,
                            );
                        }

                        // 验证唯一性
                        if ((fieldSchema as any).unique) {
                            await this.validateUniqueness(collection.name, field, fieldValue, currentId);
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Schema 验证失败: ${error.message}`);
        }
    }

    /**
     * 验证字段唯一性
     */
    private async validateUniqueness(
        collectionName: string,
        field: string,
        value: any,
        currentId?: number,
    ): Promise<void> {
        // 查询是否存在相同值的记录
        const queryBuilder = this.dictionaryRepository
            .createQueryBuilder("dictionary")
            .where("dictionary.collection = :collection", { collection: collectionName });

        // 使用 JSON 查询语法检查字段值
        // MySQL: JSON_EXTRACT(value, '$.field') = :value
        // PostgreSQL: value->>'field' = :value
        queryBuilder.andWhere(`JSON_EXTRACT(dictionary.value, '$.${field}') = :value`, {
            value: JSON.stringify(value),
        });

        // 如果是更新操作，排除当前记录
        if (currentId) {
            queryBuilder.andWhere("dictionary.id != :id", { id: currentId });
        }

        const existing = await queryBuilder.getOne();

        if (existing) {
            throw new BadRequestException(`字段 ${field} 的值 "${value}" 已存在，该字段要求唯一`);
        }
    }

    /**
     * 验证字段类型
     */
    private validateFieldType(value: any, expectedType: string): boolean {
        switch (expectedType) {
            case "string":
                return typeof value === "string";
            case "number":
                return typeof value === "number";
            case "integer":
                return typeof value === "number" && Number.isInteger(value);
            case "boolean":
                return typeof value === "boolean";
            case "array":
                return Array.isArray(value);
            case "object":
                return typeof value === "object" && value !== null && !Array.isArray(value);
            default:
                return true;
        }
    }

    /**
     * 检查集合条目数限制
     */
    private async checkMaxItems(collection: string): Promise<void> {
        const collectionEntity = await this.collectionRepository.findOne({
            where: { name: collection },
        });

        if (!collectionEntity) {
            return;
        }

        const count = await this.dictionaryRepository.count({
            where: { collection },
        });

        if (count >= collectionEntity.maxItems) {
            throw new BadRequestException(`集合 ${collection} 已达到最大条目数限制: ${collectionEntity.maxItems}`);
        }
    }

    /**
     * 检查集合访问权限
     */
    async checkPublicAccess(collection: string): Promise<void> {
        const collectionEntity = await this.collectionRepository.findOne({
            where: { name: collection },
        });

        if (!collectionEntity) {
            throw new NotFoundException(`集合不存在: ${collection}`);
        }

        const { accessType } = collectionEntity;
        if (accessType !== "public_read" && accessType !== "public_write" && accessType !== "user_private") {
            throw new ForbiddenException("该集合不允许公开访问");
        }
    }

    /**
     * 检查集合写入权限
     */
    async checkWriteAccess(collection: string): Promise<void> {
        const collectionEntity = await this.collectionRepository.findOne({
            where: { name: collection },
        });

        if (!collectionEntity) {
            throw new NotFoundException(`集合不存在: ${collection}`);
        }

        if (collectionEntity.accessType !== "public_write") {
            throw new ForbiddenException("该集合不允许公开写入");
        }
    }

    /**
     * 检查用户私有数据访问权限
     */
    async checkUserPrivateAccess(collection: string): Promise<void> {
        const collectionEntity = await this.collectionRepository.findOne({
            where: { name: collection },
        });

        if (!collectionEntity) {
            throw new NotFoundException(`集合不存在: ${collection}`);
        }

        if (collectionEntity.accessType !== "user_private") {
            throw new ForbiddenException("该集合不是用户私有集合");
        }
    }

    /**
     * 检查用户条目数限制
     */
    async checkUserMaxItems(collection: string, userId: number): Promise<void> {
        const collectionEntity = await this.collectionRepository.findOne({
            where: { name: collection },
        });

        if (!collectionEntity) {
            return;
        }

        const count = await this.dictionaryRepository.count({
            where: { collection, userId },
        });

        if (count >= collectionEntity.maxItemsPerUser) {
            throw new BadRequestException(
                `用户在集合 ${collection} 中已达到最大条目数限制: ${collectionEntity.maxItemsPerUser}`,
            );
        }
    }

    /**
     * 便捷方法：快速获取集合所有数据（用于代码中）
     */
    async getCollectionData<T = any>(collection: string): Promise<T[]> {
        const items = await this.dictionaryRepository.find({
            where: { collection, status: DictionaryStatus.ACTIVE },
            order: { sortOrder: "ASC", id: "ASC" },
        });

        return items.map((item) => item.value as T);
    }

    /**
     * 便捷方法：快速获取集合数据映射（用于代码中）
     */
    async getCollectionMap<T = any>(collection: string): Promise<Map<string, T>> {
        const items = await this.dictionaryRepository.find({
            where: { collection, status: DictionaryStatus.ACTIVE },
        });

        const map = new Map<string, T>();
        items.forEach((item) => {
            map.set(item.key, item.value as T);
        });

        return map;
    }

    /**
     * 便捷方法：快速设置值（用于代码中）
     */
    async setValue(collection: string, key: string, value: any): Promise<void> {
        const existing = await this.dictionaryRepository.findOne({
            where: { collection, key },
        });

        if (existing) {
            existing.value = value;
            await this.dictionaryRepository.save(existing);
        } else {
            await this.checkCollectionExists(collection);
            await this.checkMaxItems(collection);
            const dictionary = this.dictionaryRepository.create({
                collection,
                key,
                value,
            });
            await this.dictionaryRepository.save(dictionary);
        }

        this.logger.log(`设置字典值: ${collection}.${key}`);
    }

    /**
     * 用户私有数据：获取用户的所有数据
     */
    async getUserData(collection: string, userId: number): Promise<DictionaryCollectionResponseDto> {
        await this.checkUserPrivateAccess(collection);

        const items = await this.dictionaryRepository.find({
            where: { collection, userId, status: DictionaryStatus.ACTIVE },
            order: { sortOrder: "ASC", id: "ASC" },
        });

        return {
            collection,
            items: items.map((item) => ({
                key: item.key,
                value: { ...item.value, _key: item.key },
                sortOrder: item.sortOrder,
            })),
            total: items.length,
        };
    }

    /**
     * 用户私有数据：获取用户的单个数据
     */
    async getUserValue(collection: string, userId: number, key: string): Promise<any> {
        await this.checkUserPrivateAccess(collection);

        const dictionary = await this.dictionaryRepository.findOne({
            where: { collection, userId, key, status: DictionaryStatus.ACTIVE },
        });

        if (!dictionary) {
            throw new NotFoundException(`数据不存在: ${collection}.${key}`);
        }

        return { ...dictionary.value, _key: key };
    }

    /**
     * 用户私有数据：设置用户数据
     */
    async setUserValue(collection: string, userId: number, key: string, value: any): Promise<void> {
        await this.checkUserPrivateAccess(collection);

        const existing = await this.dictionaryRepository.findOne({
            where: { collection, userId, key },
        });

        if (existing) {
            existing.value = value;
            await this.dictionaryRepository.save(existing);
        } else {
            await this.checkUserMaxItems(collection, userId);
            const dictionary = this.dictionaryRepository.create({
                collection,
                userId,
                key,
                value,
            });
            await this.dictionaryRepository.save(dictionary);
        }

        this.logger.log(`设置用户数据: ${collection}.${key} (userId: ${userId})`);
    }

    /**
     * 用户私有数据：删除用户数据
     */
    async deleteUserValue(collection: string, userId: number, key: string): Promise<void> {
        await this.checkUserPrivateAccess(collection);

        const dictionary = await this.dictionaryRepository.findOne({
            where: { collection, userId, key },
        });

        if (!dictionary) {
            throw new NotFoundException(`数据不存在: ${collection}.${key}`);
        }

        await this.dictionaryRepository.delete(dictionary.id);

        this.logger.log(`删除用户数据: ${collection}.${key} (userId: ${userId})`);
    }

    /**
     * 转换为DTO
     */
    private toDto(entity: DictionaryEntity): DictionaryInfoDto {
        return {
            id: entity.id,
            collection: entity.collection,
            key: entity.key,
            userId: entity.userId,
            value: entity.value,
            sortOrder: entity.sortOrder,
            status: entity.status,
            remark: entity.remark,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}

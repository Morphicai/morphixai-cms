import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DictionaryCollectionEntity, CollectionStatus } from "./entities/dictionary-collection.entity";
import {
    CreateCollectionDto,
    UpdateCollectionDto,
    QueryCollectionDto,
    CollectionInfoDto,
    CollectionListResponseDto,
} from "./dto/dictionary-collection.dto";

/**
 * 字典集合配置服务
 */
@Injectable()
export class DictionaryCollectionService {
    private readonly logger = new Logger(DictionaryCollectionService.name);

    constructor(
        @InjectRepository(DictionaryCollectionEntity)
        private readonly collectionRepository: Repository<DictionaryCollectionEntity>,
    ) {}

    /**
     * 创建集合
     */
    async create(dto: CreateCollectionDto): Promise<CollectionInfoDto> {
        const existing = await this.collectionRepository.findOne({
            where: { name: dto.name },
        });

        if (existing) {
            throw new BadRequestException(`集合已存在: ${dto.name}`);
        }

        const collection = this.collectionRepository.create(dto);
        const saved = await this.collectionRepository.save(collection);

        this.logger.log(`创建集合: ${dto.name}`);

        return this.toDto(saved);
    }

    /**
     * 更新集合
     */
    async update(id: number, dto: UpdateCollectionDto): Promise<CollectionInfoDto> {
        const collection = await this.collectionRepository.findOne({ where: { id } });

        if (!collection) {
            throw new NotFoundException("集合不存在");
        }

        Object.assign(collection, dto);
        const saved = await this.collectionRepository.save(collection);

        this.logger.log(`更新集合: ${collection.name}`);

        return this.toDto(saved);
    }

    /**
     * 删除集合
     */
    async delete(id: number): Promise<void> {
        const collection = await this.collectionRepository.findOne({ where: { id } });

        if (!collection) {
            throw new NotFoundException("集合不存在");
        }

        await this.collectionRepository.delete(id);

        this.logger.log(`删除集合: ${collection.name}`);
    }

    /**
     * 查询集合列表
     */
    async findAll(dto: QueryCollectionDto): Promise<CollectionListResponseDto> {
        const { name, accessType, status, page = 1, pageSize = 20 } = dto;

        const queryBuilder = this.collectionRepository.createQueryBuilder("collection");

        if (name) {
            queryBuilder.andWhere("collection.name LIKE :name", { name: `%${name}%` });
        }

        if (accessType) {
            queryBuilder.andWhere("collection.access_type = :accessType", { accessType });
        }

        if (status) {
            queryBuilder.andWhere("collection.status = :status", { status });
        }

        queryBuilder.orderBy("collection.id", "DESC");

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
     * 根据名称获取集合
     */
    async findByName(name: string): Promise<CollectionInfoDto> {
        const collection = await this.collectionRepository.findOne({
            where: { name, status: CollectionStatus.ACTIVE },
        });

        if (!collection) {
            throw new NotFoundException(`集合不存在: ${name}`);
        }

        return this.toDto(collection);
    }

    /**
     * 获取集合访问类型
     */
    async getAccessType(name: string): Promise<string> {
        const collection = await this.collectionRepository.findOne({
            where: { name, status: CollectionStatus.ACTIVE },
        });

        return collection ? collection.accessType : "private";
    }

    /**
     * 转换为DTO
     */
    private toDto(entity: DictionaryCollectionEntity): CollectionInfoDto {
        return {
            id: entity.id,
            name: entity.name,
            displayName: entity.displayName,
            description: entity.description,
            dataType: entity.dataType,
            schema: entity.schema,
            accessType: entity.accessType,
            maxItems: entity.maxItems,
            maxItemsPerUser: entity.maxItemsPerUser,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}

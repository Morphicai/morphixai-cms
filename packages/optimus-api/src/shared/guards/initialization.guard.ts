import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { DatabaseInitializerService } from "../database/database-initializer.service";
import { InjectConnection } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import { ALLOW_BEFORE_INITIALIZATION } from "../decorators/allow-before-initialization.decorator";

/**
 * 初始化守卫
 * 
 * 功能：
 * 1. 检查系统是否已初始化
 * 2. 如果未初始化，只允许访问标记了 @AllowBeforeInitialization 的接口
 * 3. 如果已初始化，允许所有接口访问
 * 
 * 使用场景：
 * - 系统首次安装时，只有初始化接口可以访问
 * - 初始化完成后，所有接口都可以正常访问
 */
@Injectable()
export class InitializationGuard implements CanActivate {
    private readonly logger = new Logger(InitializationGuard.name);
    private initializationStatusCache: boolean | null = null;
    private cacheTimestamp: number = 0;
    private readonly CACHE_TTL = 5000; // 缓存5秒，避免频繁查询数据库

    constructor(
        private reflector: Reflector,
        @InjectConnection() private readonly connection: Connection,
        private readonly databaseInitializer: DatabaseInitializerService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();

        // 检查是否有 @AllowBeforeInitialization 装饰器
        const allowBeforeInitialization = this.reflector.getAllAndOverride<boolean>(
            ALLOW_BEFORE_INITIALIZATION,
            [context.getHandler(), context.getClass()],
        );

        // 如果接口标记为允许未初始化时访问，直接放行
        if (allowBeforeInitialization) {
            this.logger.debug(`Route ${request.method} ${request.path} allows access before initialization`);
            return true;
        }

        // 检查系统是否已初始化
        const isInitialized = await this.checkInitializationStatus();

        if (!isInitialized) {
            this.logger.warn(
                `Access denied to ${request.method} ${request.path}: System not initialized. Please initialize the system first.`,
            );
            throw new ForbiddenException({
                code: "SYSTEM_NOT_INITIALIZED",
                message: "系统尚未初始化，请先完成系统初始化",
                detail: "请访问 /api/setup/status 查看系统状态，或访问 /api/setup/initialize 进行初始化",
            });
        }

        return true;
    }

    /**
     * 检查系统是否已初始化
     * 使用缓存机制减少数据库查询
     */
    private async checkInitializationStatus(): Promise<boolean> {
        const now = Date.now();

        // 如果缓存有效，直接返回缓存值
        if (
            this.initializationStatusCache !== null &&
            now - this.cacheTimestamp < this.CACHE_TTL
        ) {
            return this.initializationStatusCache;
        }

        try {
            // 查询数据库初始化状态
            const dbInfo = await this.databaseInitializer.getDatabaseInitializationStatus(
                this.connection,
            );

            // 如果数据库信息表存在且有数据，认为已初始化
            const isInitialized = dbInfo !== null;

            // 更新缓存
            this.initializationStatusCache = isInitialized;
            this.cacheTimestamp = now;

            this.logger.debug(`Initialization status checked: ${isInitialized}`);

            return isInitialized;
        } catch (error) {
            this.logger.error(`Failed to check initialization status: ${error.message}`, error.stack);
            // 如果查询失败，为了安全起见，假设未初始化
            // 这样只有标记了 @AllowBeforeInitialization 的接口可以访问
            return false;
        }
    }

    /**
     * 清除初始化状态缓存
     * 在初始化完成后调用，确保后续请求能获取到最新的初始化状态
     */
    clearCache(): void {
        this.initializationStatusCache = null;
        this.cacheTimestamp = 0;
        this.logger.debug("Initialization status cache cleared");
    }
}


import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DatabaseInitializerModule } from "../database/database-initializer.module";
import { InitializationGuard } from "./initialization.guard";

/**
 * 初始化守卫模块
 * 
 * 提供全局的 InitializationGuard，可以在任何模块中注入使用
 * 用于检查系统是否已初始化，并管理初始化状态缓存
 */
@Global()
@Module({
    imports: [TypeOrmModule, DatabaseInitializerModule],
    providers: [InitializationGuard],
    exports: [InitializationGuard],
})
export class InitializationModule {}


import { SetMetadata } from "@nestjs/common";

export const OPERATION_LOG_KEY = "operation_log";

/**
 * 操作日志配置选项
 */
export interface OperationLogOptions {
    /** 模块名称，如：user, role, menu */
    module: string;
    /** 操作类型，如：create, update, delete */
    action: string;
    /** 操作描述，支持模板变量 */
    description?: string;
    /** 是否记录请求参数 */
    recordParams?: boolean;
    /** 是否记录响应数据 */
    recordResponse?: boolean;
}

/**
 * 操作日志装饰器
 * 用于标记需要记录操作日志的方法
 *
 * @example
 * ```typescript
 * @OperationLog({
 *   module: 'user',
 *   action: 'create',
 *   description: '创建用户'
 * })
 * async create(@Body() dto: CreateUserDto) {
 *   return await this.userService.create(dto);
 * }
 * ```
 */
export const OperationLog = (options: OperationLogOptions) => SetMetadata(OPERATION_LOG_KEY, options);

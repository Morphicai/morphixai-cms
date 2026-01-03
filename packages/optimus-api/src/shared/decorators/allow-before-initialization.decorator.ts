import { SetMetadata } from "@nestjs/common";

export const ALLOW_BEFORE_INITIALIZATION = "allowBeforeInitialization";

/**
 * 允许在系统未初始化时访问的接口
 * 用于初始化相关的接口，如 /api/setup/status 和 /api/setup/initialize
 */
export const AllowBeforeInitialization = () => SetMetadata(ALLOW_BEFORE_INITIALIZATION, true);


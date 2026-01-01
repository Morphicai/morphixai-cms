/**
 * 认证 API 客户端 - 简化版
 * 提供自动 token 管理的 HTTP 客户端
 */

// 导入类用于工厂函数
import { ApiClient } from "./api-client";
import { AuthenticatedApiClient } from "./authenticated-api-client";
import { AuthenticationManager } from "./authentication-manager";

// API客户端
export { ApiClient } from "./api-client";
export { AuthenticatedApiClient } from "./authenticated-api-client";
export { FileUploadClient, createFileUploadClient } from "./file-upload-client";

// 认证管理
export { AuthenticationManager } from "./authentication-manager";
export { TokenManager } from "./token-manager";
export { CaptchaHandler } from "./captcha-handler";

// 类型导出
export type { ApiResponse, RequestOptions } from "./api-client";
export type { LoginCredentials, AuthResult, IAuthenticationManager } from "./authentication-manager";

// 全局客户端注册表，用于资源清理
const globalClientRegistry = new Set<any>();

/**
 * 注册客户端到全局清理列表
 */
function registerClient(client: any): void {
    globalClientRegistry.add(client);
}

/**
 * 清理所有注册的客户端
 */
export function cleanupAllClients(): void {
    for (const client of globalClientRegistry) {
        try {
            if (client && typeof client.destroy === "function") {
                client.destroy();
            }
        } catch (error) {
            console.warn("Client cleanup warning:", error);
        }
    }
    globalClientRegistry.clear();
}

/**
 * 创建认证 API 客户端
 * 这是主要的入口点，提供自动登录检测和 token 管理功能
 *
 * @param baseUrl API 基础 URL
 * @returns 认证 API 客户端实例
 *
 * @example
 * ```typescript
 * import { createAuthenticatedClient } from './auth';
 *
 * const client = createAuthenticatedClient('http://localhost:8082');
 *
 * // 直接发送请求 - 自动检测登录状态并登录
 * const response = await client.get('/api/users');
 *
 * // 可选：设置自定义登录凭据
 * client.setDefaultCredentials('username', 'password');
 *
 * // 可选：禁用自动登录
 * client.setAutoLoginEnabled(false);
 * await client.login('admin', 'password'); // 手动登录
 * ```
 */
export function createAuthenticatedClient(baseUrl: string) {
    const client = new AuthenticatedApiClient(baseUrl);
    registerClient(client);
    return client;
}

/**
 * 创建基础 API 客户端
 * 用于不需要认证的请求
 *
 * @param baseUrl API 基础 URL
 * @returns 基础 API 客户端实例
 */
export function createApiClient(baseUrl: string) {
    const client = new ApiClient(baseUrl);
    registerClient(client);
    return client;
}

/**
 * 创建认证管理器
 * 用于手动管理认证流程
 *
 * @param baseUrl API 基础 URL
 * @returns 认证管理器实例
 */
export function createAuthManager(baseUrl: string) {
    const manager = new AuthenticationManager(baseUrl);
    registerClient(manager);
    return manager;
}

// 默认导出主要的客户端创建函数
export default createAuthenticatedClient;

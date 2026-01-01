import { AuthenticatedApiClient } from "./authenticated-api-client";
import { ApiResponse } from "./api-client";

/**
 * 文件上传客户端 - 扩展 AuthenticatedApiClient 支持文件上传
 * 注意：实际的文件上传功能需要额外的 form-data 处理，这里提供接口定义
 */
export class FileUploadClient extends AuthenticatedApiClient {
    /**
     * 上传单个文件（占位方法）
     * 实际使用时需要实现 multipart/form-data 处理
     */
    async uploadFile(
        filePath: string,
        options: {
            business?: string;
            generateThumbnail?: boolean;
            endpoint?: string;
        } = {},
    ): Promise<ApiResponse> {
        // 确保已认证
        await (this as any).ensureAuthenticated();

        // 这里应该实现实际的文件上传逻辑
        // 由于需要处理 multipart/form-data，暂时抛出提示错误
        throw new Error("文件上传功能需要实现 multipart/form-data 处理，请使用其他工具或库");
    }

    /**
     * 上传多个文件（占位方法）
     * 实际使用时需要实现 multipart/form-data 处理
     */
    async uploadMultipleFiles(
        filePaths: string[],
        options: {
            business?: string;
            generateThumbnail?: boolean;
            endpoint?: string;
        } = {},
    ): Promise<ApiResponse> {
        // 确保已认证
        await (this as any).ensureAuthenticated();

        // 这里应该实现实际的多文件上传逻辑
        throw new Error("多文件上传功能需要实现 multipart/form-data 处理，请使用其他工具或库");
    }

    /**
     * 下载文件
     */
    async downloadFile(fileId: number | string): Promise<{
        data: Buffer;
        contentType: string;
        fileName?: string;
    }> {
        // 确保已认证 - 调用父类的私有方法
        await (this as any).ensureAuthenticated();
        const token = await this.getAuthManager().getValidToken();

        const baseClient = this.getBaseClient();

        try {
            const response = await baseClient["axiosInstance"].get(`/oss/download/${fileId}`, {
                headers: {
                    Authorization: token,
                },
                responseType: "arraybuffer",
            });

            return {
                data: Buffer.from(response.data as ArrayBuffer),
                contentType: response.headers["content-type"] || "application/octet-stream",
                fileName: response.headers["content-disposition"]?.match(/filename="(.+)"/)?.[1],
            };
        } catch (error) {
            throw baseClient["handleError"](error, "GET", `/oss/download/${fileId}`);
        }
    }

    /**
     * 获取文件列表
     */
    async getFileList(
        params: {
            page?: number;
            pageSize?: number;
            business?: string;
        } = {},
    ): Promise<ApiResponse> {
        return this.get("/api/oss/list", { params });
    }

    /**
     * 获取文件信息
     */
    async getFileInfo(fileId: number | string): Promise<ApiResponse> {
        return this.get(`/api/oss/info/${fileId}`);
    }

    /**
     * 删除文件
     */
    async deleteFile(fileId: number | string): Promise<ApiResponse> {
        return this.delete(`/api/oss/${fileId}`);
    }

    /**
     * 检查存储健康状态
     */
    async checkStorageHealth(): Promise<ApiResponse> {
        return this.get("/api/oss/health");
    }
}

/**
 * 创建文件上传客户端
 */
export function createFileUploadClient(baseUrl: string): FileUploadClient {
    return new FileUploadClient(baseUrl);
}

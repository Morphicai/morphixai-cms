import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * HTTP客户端助手类
 * 用于管理测试中的HTTP连接，确保连接能够正确关闭
 */
export class HttpClientHelper {
    private static instance: HttpClientHelper;
    private axiosInstance: AxiosInstance;
    private activeRequests: Set<Promise<any>> = new Set();

    private constructor() {
        this.axiosInstance = axios.create({
            timeout: 10000,
            // 禁用连接池，确保连接能够正确关闭
            httpAgent: false,
            httpsAgent: false,
        });

        // 请求拦截器
        this.axiosInstance.interceptors.request.use((config) => {
            return config;
        });

        // 响应拦截器
        this.axiosInstance.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                return Promise.reject(error);
            },
        );
    }

    public static getInstance(): HttpClientHelper {
        if (!HttpClientHelper.instance) {
            HttpClientHelper.instance = new HttpClientHelper();
        }
        return HttpClientHelper.instance;
    }

    public async get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        const request = this.axiosInstance.get(url, config);
        this.activeRequests.add(request);

        try {
            const response = await request;
            return response;
        } finally {
            this.activeRequests.delete(request);
        }
    }

    public async post(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        const request = this.axiosInstance.post(url, data, config);
        this.activeRequests.add(request);

        try {
            const response = await request;
            return response;
        } finally {
            this.activeRequests.delete(request);
        }
    }

    public async put(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        const request = this.axiosInstance.put(url, data, config);
        this.activeRequests.add(request);

        try {
            const response = await request;
            return response;
        } finally {
            this.activeRequests.delete(request);
        }
    }

    public async delete(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        const request = this.axiosInstance.delete(url, config);
        this.activeRequests.add(request);

        try {
            const response = await request;
            return response;
        } finally {
            this.activeRequests.delete(request);
        }
    }

    /**
     * 等待所有活跃请求完成
     */
    public async waitForActiveRequests(timeout = 5000): Promise<void> {
        if (this.activeRequests.size === 0) {
            return;
        }

        const timeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => reject(new Error("Timeout waiting for active requests")), timeout);
        });

        const allRequestsPromise = Promise.allSettled(Array.from(this.activeRequests));

        try {
            await Promise.race([allRequestsPromise, timeoutPromise]);
        } catch (error) {
            console.warn("⚠️  Some HTTP requests did not complete within timeout");
        }
    }

    /**
     * 清理HTTP客户端
     */
    public async cleanup(): Promise<void> {
        // 等待活跃请求完成
        await this.waitForActiveRequests(2000);

        // 清空活跃请求集合
        this.activeRequests.clear();

        // 重置axios实例的超时时间，强制关闭连接
        this.axiosInstance.defaults.timeout = 1;

        console.log("🧹 HTTP client cleaned up");
    }

    /**
     * 重置单例实例（用于测试清理）
     */
    public static reset(): void {
        if (HttpClientHelper.instance) {
            HttpClientHelper.instance.cleanup();
            HttpClientHelper.instance = null;
        }
    }
}

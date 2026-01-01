import { Injectable, Logger } from "@nestjs/common";
import { DictionaryService } from "./dictionary.service";

/**
 * AI 配置接口
 */
export interface AIConfig {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    enabled: boolean;
    [key: string]: any;
}

/**
 * API Key 配置接口
 */
export interface APIKeyConfig {
    name: string;
    apiKey: string;
    secret?: string;
    permissions: string[];
    rateLimit: number;
    rateLimitPeriod: string;
    enabled: boolean;
    expiresAt?: string;
    createdAt: string;
}

/**
 * AI 提示词接口
 */
export interface AIPrompt {
    name: string;
    description: string;
    template: string;
    variables: string[];
    model: string;
    temperature: number;
    maxTokens: number;
    enabled: boolean;
}

/**
 * 配置服务 - 提供便捷的配置访问方法
 */
@Injectable()
export class ConfigService {
    private readonly logger = new Logger(ConfigService.name);

    constructor(private readonly dictionaryService: DictionaryService) {}

    /**
     * 获取 AI 配置
     */
    async getAIConfig(provider: string): Promise<AIConfig> {
        const config = await this.dictionaryService.getValue("ai_config", provider);
        return config as AIConfig;
    }

    /**
     * 获取所有启用的 AI 配置
     */
    async getEnabledAIConfigs(): Promise<AIConfig[]> {
        const configs = await this.dictionaryService.getCollectionData<AIConfig>("ai_config");
        return configs.filter((c) => c.enabled);
    }

    /**
     * 更新 AI 配置
     */
    async updateAIConfig(provider: string, config: Partial<AIConfig>): Promise<void> {
        const current = await this.getAIConfig(provider);
        await this.dictionaryService.setValue("ai_config", provider, {
            ...current,
            ...config,
        });
        this.logger.log(`更新 AI 配置: ${provider}`);
    }

    /**
     * 获取 API Key 配置
     */
    async getAPIKey(system: string): Promise<APIKeyConfig> {
        const config = await this.dictionaryService.getValue("api_keys", system);
        return config as APIKeyConfig;
    }

    /**
     * 验证 API Key
     */
    async validateAPIKey(apiKey: string): Promise<APIKeyConfig | null> {
        const apiKeys = await this.dictionaryService.getCollectionData<APIKeyConfig>("api_keys");

        for (const config of apiKeys) {
            if (config.apiKey === apiKey && config.enabled) {
                // 检查是否过期
                if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
                    continue;
                }
                return config;
            }
        }

        return null;
    }

    /**
     * 创建 API Key
     */
    async createAPIKey(system: string, config: Omit<APIKeyConfig, "createdAt">): Promise<void> {
        await this.dictionaryService.setValue("api_keys", system, {
            ...config,
            createdAt: new Date().toISOString(),
        });
        this.logger.log(`创建 API Key: ${system}`);
    }

    /**
     * 获取 AI 提示词
     */
    async getAIPrompt(key: string): Promise<AIPrompt> {
        const prompt = await this.dictionaryService.getValue("ai_prompts", key);
        return prompt as AIPrompt;
    }

    /**
     * 渲染提示词模板
     */
    async renderPrompt(key: string, variables: Record<string, any>): Promise<string> {
        const prompt = await this.getAIPrompt(key);

        if (!prompt.enabled) {
            throw new Error(`提示词未启用: ${key}`);
        }

        let rendered = prompt.template;

        // 替换变量
        for (const [varName, value] of Object.entries(variables)) {
            const placeholder = `{{${varName}}}`;
            rendered = rendered.replace(new RegExp(placeholder, "g"), String(value));
        }

        return rendered;
    }

    /**
     * 获取所有启用的提示词
     */
    async getEnabledPrompts(): Promise<Map<string, AIPrompt>> {
        const prompts = await this.dictionaryService.getCollectionMap<AIPrompt>("ai_prompts");
        const enabled = new Map<string, AIPrompt>();

        for (const [key, prompt] of prompts.entries()) {
            if (prompt.enabled) {
                enabled.set(key, prompt);
            }
        }

        return enabled;
    }

    /**
     * 更新提示词
     */
    async updatePrompt(key: string, prompt: Partial<AIPrompt>): Promise<void> {
        const current = await this.getAIPrompt(key);
        await this.dictionaryService.setValue("ai_prompts", key, {
            ...current,
            ...prompt,
        });
        this.logger.log(`更新提示词: ${key}`);
    }

    /**
     * 获取系统配置
     */
    async getSystemConfig<T = any>(key: string): Promise<T> {
        const config = await this.dictionaryService.getValue("system_config", key);
        return config as T;
    }

    /**
     * 更新系统配置
     */
    async updateSystemConfig(key: string, value: any): Promise<void> {
        await this.dictionaryService.setValue("system_config", key, value);
        this.logger.log(`更新系统配置: ${key}`);
    }

    /**
     * 检查维护模式
     */
    async isMaintenanceMode(): Promise<boolean> {
        const config = await this.getSystemConfig<{ enabled: boolean }>("maintenance_mode");
        return config.enabled;
    }

    /**
     * 获取 AI 功能开关
     */
    async getAIFeatures(): Promise<Record<string, boolean>> {
        const config = await this.getSystemConfig<Record<string, boolean>>("ai_features");
        return config;
    }

    /**
     * 检查 AI 功能是否启用
     */
    async isAIFeatureEnabled(feature: string): Promise<boolean> {
        const features = await this.getAIFeatures();
        return features[feature] === true;
    }
}

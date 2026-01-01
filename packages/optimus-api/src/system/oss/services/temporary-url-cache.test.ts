/**
 * 临时 URL 缓存功能测试
 *
 * 运行方式：
 * npx ts-node packages/optimus-api/src/system/oss/services/temporary-url-cache.test.ts
 */

import { TemporaryUrlService } from "./temporary-url.service";
import { StorageFactory } from "../factory/storage.factory";

// 模拟 StorageFactory
class MockStorageFactory {
    getStorageProvider() {
        return "aliyun";
    }

    create() {
        return {
            async generateTemporaryUrl(fileKey: string, options: any) {
                // 模拟生成临时 URL
                const timestamp = Date.now();
                return `https://example.oss.aliyuncs.com/${fileKey}?expires=${options.expiresIn}&signature=mock_${timestamp}`;
            },
            async fileExists(fileKey: string) {
                return true;
            },
        };
    }
}

async function testCache() {
    console.log("=== 临时 URL 缓存功能测试 ===\n");

    const factory = new MockStorageFactory() as any;
    const service = new TemporaryUrlService(factory);

    // 测试 1: 基本缓存功能
    console.log("测试 1: 基本缓存功能");
    const fileKey = "test/file.jpg";

    console.log("第一次请求（生成新 URL）...");
    const result1 = await service.generateTemporaryUrl(fileKey, { expiresIn: 3600 });
    console.log(`URL: ${result1.temporaryUrl}`);
    console.log(`过期时间: ${result1.expiresAt.toISOString()}`);

    console.log("\n第二次请求（应该命中缓存）...");
    const result2 = await service.generateTemporaryUrl(fileKey, { expiresIn: 3600 });
    console.log(`URL: ${result2.temporaryUrl}`);
    console.log(`URL 相同: ${result1.temporaryUrl === result2.temporaryUrl}`);

    let stats = service.getCacheStats();
    console.log(`缓存统计: 大小=${stats.size}, 命中率=${(stats.hitRate * 100).toFixed(2)}%\n`);

    // 测试 2: 不同过期时间
    console.log("测试 2: 不同过期时间（不会命中缓存）");
    const result3 = await service.generateTemporaryUrl(fileKey, { expiresIn: 7200 });
    console.log(`URL: ${result3.temporaryUrl}`);
    console.log(`URL 不同: ${result1.temporaryUrl !== result3.temporaryUrl}`);

    stats = service.getCacheStats();
    console.log(`缓存统计: 大小=${stats.size}, 命中率=${(stats.hitRate * 100).toFixed(2)}%\n`);

    // 测试 3: 不同文件
    console.log("测试 3: 不同文件");
    const fileKey2 = "test/file2.jpg";
    const result4 = await service.generateTemporaryUrl(fileKey2, { expiresIn: 3600 });
    console.log(`文件2 URL: ${result4.temporaryUrl}`);

    stats = service.getCacheStats();
    console.log(`缓存统计: 大小=${stats.size}, 命中率=${(stats.hitRate * 100).toFixed(2)}%\n`);

    // 测试 4: 清除特定文件缓存
    console.log("测试 4: 清除特定文件缓存");
    service.clearCache(fileKey);
    console.log(`已清除 ${fileKey} 的缓存`);

    const result5 = await service.generateTemporaryUrl(fileKey, { expiresIn: 3600 });
    console.log(`清除后重新请求，URL 不同: ${result1.temporaryUrl !== result5.temporaryUrl}`);

    stats = service.getCacheStats();
    console.log(`缓存统计: 大小=${stats.size}, 命中率=${(stats.hitRate * 100).toFixed(2)}%\n`);

    // 测试 5: 批量请求测试缓存效果
    console.log("测试 5: 批量请求测试缓存效果");
    const files = Array.from({ length: 10 }, (_, i) => `test/batch_${i}.jpg`);

    console.log("第一轮请求（全部生成新 URL）...");
    const startTime1 = Date.now();
    for (const file of files) {
        await service.generateTemporaryUrl(file, { expiresIn: 3600 });
    }
    const duration1 = Date.now() - startTime1;
    console.log(`耗时: ${duration1}ms`);

    console.log("\n第二轮请求（全部命中缓存）...");
    const startTime2 = Date.now();
    for (const file of files) {
        await service.generateTemporaryUrl(file, { expiresIn: 3600 });
    }
    const duration2 = Date.now() - startTime2;
    console.log(`耗时: ${duration2}ms`);
    console.log(`性能提升: ${((1 - duration2 / duration1) * 100).toFixed(2)}%`);

    stats = service.getCacheStats();
    console.log(`缓存统计: 大小=${stats.size}, 命中率=${(stats.hitRate * 100).toFixed(2)}%\n`);

    // 测试 6: 清除所有缓存
    console.log("测试 6: 清除所有缓存");
    service.clearAllCache();
    stats = service.getCacheStats();
    console.log(`清除后缓存大小: ${stats.size}\n`);

    // 测试 7: 短期过期时间（测试缓冲时间）
    console.log("测试 7: 短期过期时间（小于缓冲时间）");
    try {
        const result6 = await service.generateTemporaryUrl(fileKey, { expiresIn: 60 });
        console.log(`生成成功，但缓存可能不会生效（过期时间太短）`);
        console.log(`URL: ${result6.temporaryUrl}`);
    } catch (error) {
        console.log(`错误: ${error.message}`);
    }

    stats = service.getCacheStats();
    console.log(`最终缓存统计: 大小=${stats.size}, 命中率=${(stats.hitRate * 100).toFixed(2)}%`);

    console.log("\n=== 测试完成 ===");
}

// 运行测试
testCache().catch(console.error);

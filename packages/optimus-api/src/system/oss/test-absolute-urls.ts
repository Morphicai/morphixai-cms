/**
 * 测试绝对 URL 生成
 */

import { ProxyUrlUtils } from "./utils/proxy-url.utils";

// 模拟环境变量
process.env.SITE_DOMAIN = "http://localhost:8084";

function testAbsoluteUrls() {
    console.log("=== 测试绝对 URL 生成 ===\n");

    const fileKey = "cdac07def2834b70a1619529508d7493.jpeg";
    const baseUrl = process.env.SITE_DOMAIN;

    console.log("环境配置:");
    console.log(`SITE_DOMAIN: ${baseUrl}`);
    console.log("");

    // 测试基本代理 URL
    const proxyUrl = ProxyUrlUtils.generateProxyUrl(fileKey, { baseUrl });
    console.log("基本代理 URL:");
    console.log(`输入: ${fileKey}`);
    console.log(`输出: ${proxyUrl}`);
    console.log("");

    // 测试缩略图代理 URL
    const thumbnailUrl = ProxyUrlUtils.generateThumbnailProxyUrl(fileKey, { baseUrl });
    console.log("缩略图代理 URL:");
    console.log(`输入: ${fileKey}`);
    console.log(`输出: ${thumbnailUrl}`);
    console.log("");

    // 测试安全访问 URL
    const secureUrl = ProxyUrlUtils.generateProxyUrl(fileKey, {
        baseUrl,
        secure: true,
    });
    console.log("安全访问 URL:");
    console.log(`输入: ${fileKey}`);
    console.log(`输出: ${secureUrl}`);
    console.log("");

    // 测试下载 URL
    const downloadUrl = ProxyUrlUtils.generateProxyUrl(fileKey, {
        baseUrl,
        download: true,
    });
    console.log("下载 URL:");
    console.log(`输入: ${fileKey}`);
    console.log(`输出: ${downloadUrl}`);
    console.log("");

    // 测试存储提供商特定 URL
    const aliyunUrl = ProxyUrlUtils.generateFileProxyUrl("aliyun", fileKey, { baseUrl });
    console.log("阿里云代理 URL:");
    console.log(`输入: aliyun, ${fileKey}`);
    console.log(`输出: ${aliyunUrl}`);
    console.log("");

    console.log("=== URL 格式对比 ===\n");

    console.log("修改前（直接访问）:");
    console.log("https://example.oss-cn-beijing.aliyuncs.com/cdac07def2834b70a1619529508d7493.jpeg");
    console.log("");

    console.log("修改后（代理访问 - 相对路径）:");
    console.log("/api/files/file/cdac07def2834b70a1619529508d7493.jpeg");
    console.log("");

    console.log("修改后（代理访问 - 绝对路径）:");
    console.log(proxyUrl);
    console.log("");

    console.log("✅ 绝对路径的优势:");
    console.log("1. 避免前端路由冲突");
    console.log("2. 可以直接在浏览器中访问");
    console.log("3. 适合在邮件、消息等场景中使用");
    console.log("4. 前端无需处理基础 URL 拼接");
}

// 运行测试
if (require.main === module) {
    testAbsoluteUrls();
}

export { testAbsoluteUrls };

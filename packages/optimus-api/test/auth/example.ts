/**
 * 使用示例
 */

import { createAuthenticatedClient } from "./index";

async function example() {
    // 创建认证客户端
    const client = createAuthenticatedClient("http://localhost:8082");

    try {
        // 登录
        console.log("正在登录...");
        await client.login("admin", "admin123");
        console.log("登录成功！");

        // 发送认证请求 - 自动携带 token
        console.log("获取用户列表...");
        const users = await client.get("/api/users");
        console.log("用户数量:", users.data?.length || 0);

        // 创建新用户
        console.log("创建新用户...");
        const newUser = await client.post("/api/users", {
            account: "testuser",
            fullName: "测试用户",
            email: "test@example.com",
            phoneNum: "13800138000",
        });
        console.log("新用户创建成功:", newUser.data?.id);

        // 检查认证状态
        console.log("认证状态:", client.isAuthenticated());
    } catch (error) {
        console.error("操作失败:", error.message);
    } finally {
        // 登出
        await client.logout();
        console.log("已登出");
    }
}

// 如果直接运行此文件
if (require.main === module) {
    example().catch(console.error);
}

export { example };

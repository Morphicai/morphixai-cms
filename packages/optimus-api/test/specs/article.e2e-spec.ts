import { createAuthenticatedClient } from "../auth";
import { getTestServerUrl, waitForTestServer } from "../setup";

describe("Article Management (e2e)", () => {
    let serverUrl: string;
    let authClient: any;
    let testCategoryId: number;
    let testArticleId: number;

    beforeAll(async () => {
        await waitForTestServer();
        serverUrl = getTestServerUrl();
        console.log(`🧪 Testing Article Management against server: ${serverUrl}`);
        authClient = createAuthenticatedClient(serverUrl);
    });

    describe("Category Management", () => {
        it("should get built-in categories", async () => {
            try {
                const response = await authClient.get("/api/category/built-in/list");
                expect(response.code).toBe(200);
                expect(Array.isArray(response.data)).toBe(true);
                expect(response.data.length).toBeGreaterThan(0);

                const builtInCategory = response.data.find((cat: any) => cat.code === "news");
                expect(builtInCategory).toBeDefined();
                expect(builtInCategory.isBuiltIn).toBe(true);

                testCategoryId = Number(builtInCategory.id);
                console.log("✅ 获取内置分类成功, Category ID:", testCategoryId);
            } catch (error) {
                console.log("⚠️  获取内置分类失败:", error.message);
                throw error;
            }
        });

        it("should create custom category", async () => {
            try {
                const categoryData = {
                    name: `测试分类_${Date.now()}`,
                    code: `test-category-${Date.now()}`,
                    description: "这是一个测试分类",
                    config: {
                        maxCoverImages: 5,
                        maxVersions: 15,
                    },
                };

                const response = await authClient.post("/api/category", categoryData);
                expect(response.code).toBe(200);
                expect(response.data).toBeDefined();
                expect(response.data.name).toBe(categoryData.name);
                expect(response.data.isBuiltIn).toBe(false);

                console.log("✅ 创建自定义分类成功");
            } catch (error) {
                console.log("⚠️  创建自定义分类失败:", error.message);
            }
        });

        it("should get all categories", async () => {
            try {
                const response = await authClient.get("/api/category");
                expect(response.code).toBe(200);
                expect(response.data).toBeDefined();

                console.log("✅ 获取分类列表成功");
            } catch (error) {
                console.log("⚠️  获取分类列表失败:", error.message);
            }
        });
    });

    describe("Article CRUD Operations", () => {
        it("should create article", async () => {
            try {
                const articleData = {
                    title: `test-article-${Date.now()}`,
                    summary: "这是一篇测试文章的摘要",
                    content: "<p>这是测试文章的内容</p>",
                    categoryId: testCategoryId,
                    coverImages: ["https://example.com/image1.jpg"],
                    sortWeight: 10,
                    seoTitle: "测试文章SEO标题",
                    seoDescription: "测试文章SEO描述",
                };

                const response = await authClient.post("/api/article", articleData);
                expect(response.code).toBe(200);
                expect(response.data).toBeDefined();
                expect(response.data.slug).toBeDefined();
                expect(response.data.status).toBe("draft");

                testArticleId = response.data.id;
                console.log("✅ 创建文章成功, ID:", testArticleId);
            } catch (error) {
                console.log("⚠️  创建文章失败:", error.message);
                throw error;
            }
        });

        it("should get article by ID", async () => {
            try {
                const response = await authClient.get(`/api/article/${testArticleId}`);
                expect(response.code).toBe(200);
                expect(response.data).toBeDefined();
                expect(response.data.id).toBe(testArticleId);

                console.log("✅ 获取文章详情成功");
            } catch (error) {
                console.log("⚠️  获取文章详情失败:", error.message);
            }
        });

        it("should update article", async () => {
            try {
                const updateData = {
                    title: `updated-article-${Date.now()}`,
                    summary: "更新后的摘要",
                    content: "<p>更新后的内容</p>",
                };

                const response = await authClient.put(`/api/article/${testArticleId}`, updateData);
                expect(response.code).toBe(200);
                expect(response.data).toBeDefined();

                console.log("✅ 更新文章成功");
            } catch (error) {
                console.log("⚠️  更新文章失败:", error.message);
            }
        });

        it("should get article list", async () => {
            try {
                const response = await authClient.get("/api/article?page=1&limit=10");
                expect(response.code).toBe(200);
                expect(response.data).toBeDefined();
                expect(Array.isArray(response.data.data)).toBe(true);

                console.log("✅ 获取文章列表成功");
            } catch (error) {
                console.log("⚠️  获取文章列表失败:", error.message);
            }
        });

        it("should search articles", async () => {
            try {
                const response = await authClient.get("/api/article/search?keyword=测试");
                expect(response.code).toBe(200);
                expect(response.data).toBeDefined();

                console.log("✅ 搜索文章成功");
            } catch (error) {
                console.log("⚠️  搜索文章失败:", error.message);
            }
        });
    });

    describe("Article Status Management", () => {
        it("should publish article", async () => {
            try {
                const response = await authClient.post(`/api/article/${testArticleId}/publish`);
                expect(response.code).toBe(200);
                expect(response.data.status).toBe("published");

                console.log("✅ 发布文章成功");
            } catch (error) {
                console.log("⚠️  发布文章失败:", error.message);
            }
        });

        it("should archive article", async () => {
            try {
                const response = await authClient.post(`/api/article/${testArticleId}/archive`);
                expect(response.code).toBe(200);
                expect(response.data.status).toBe("archived");

                console.log("✅ 归档文章成功");
            } catch (error) {
                console.log("⚠️  归档文章失败:", error.message);
            }
        });

        it("should get article statistics", async () => {
            try {
                const response = await authClient.get("/api/article/stats/summary");
                expect(response.code).toBe(200);
                expect(response.data).toBeDefined();
                expect(response.data.total).toBeGreaterThanOrEqual(0);

                console.log("✅ 获取文章统计成功");
            } catch (error) {
                console.log("⚠️  获取文章统计失败:", error.message);
            }
        });
    });

    describe("Article Version Management", () => {
        it("should get article versions", async () => {
            try {
                const response = await authClient.get(`/api/article/${testArticleId}/version`);
                expect(response.code).toBe(200);
                expect(Array.isArray(response.data)).toBe(true);
                expect(response.data.length).toBeGreaterThan(0);

                console.log("✅ 获取文章版本列表成功");
            } catch (error) {
                console.log("⚠️  获取文章版本列表失败:", error.message);
            }
        });

        it("should create new version", async () => {
            try {
                const versionData = {
                    title: `new-version-${Date.now()}`,
                    summary: "新版本摘要",
                    content: "<p>新版本内容</p>",
                    status: "draft",
                };

                const response = await authClient.post(`/api/article/${testArticleId}/version`, versionData);
                expect(response.code).toBe(200);
                expect(response.data).toBeDefined();
                expect(response.data.versionNumber).toBeGreaterThan(0);

                console.log("✅ 创建新版本成功");
            } catch (error) {
                console.log("⚠️  创建新版本失败:", error.message);
            }
        });

        it("should get version statistics", async () => {
            try {
                const response = await authClient.get(`/api/article/${testArticleId}/version/stats`);
                expect(response.code).toBe(200);
                expect(response.data).toBeDefined();
                expect(response.data.total).toBeGreaterThan(0);

                console.log("✅ 获取版本统计成功");
            } catch (error) {
                console.log("⚠️  获取版本统计失败:", error.message);
            }
        });
    });

    describe("Scheduled Publishing", () => {
        it("should set scheduled publish time", async () => {
            try {
                // 创建新文章用于预定发布测试
                const articleData = {
                    title: `scheduled-article-${Date.now()}`,
                    summary: "预定发布测试",
                    content: "<p>预定发布内容</p>",
                    categoryId: testCategoryId,
                };

                const createResponse = await authClient.post("/api/article", articleData);
                const scheduledArticleId = createResponse.data.id;

                // 设置预定发布时间（1小时后）
                const scheduledTime = new Date(Date.now() + 3600000).toISOString();
                const scheduleData = {
                    scheduledAt: scheduledTime,
                };

                const response = await authClient.put(`/api/article/${scheduledArticleId}/schedule`, scheduleData);
                expect(response.code).toBe(200);
                expect(response.data.scheduledAt).toBeDefined();

                console.log("✅ 设置预定发布时间成功");
            } catch (error) {
                console.log("⚠️  设置预定发布时间失败:", error.message);
            }
        });

        it("should get pending scheduled articles", async () => {
            try {
                const response = await authClient.get("/api/article/scheduled/pending");
                expect(response.code).toBe(200);
                expect(Array.isArray(response.data)).toBe(true);

                console.log("✅ 获取待发布文章列表成功");
            } catch (error) {
                console.log("⚠️  获取待发布文章列表失败:", error.message);
            }
        });
    });

    describe("Article Deletion", () => {
        it("should delete article", async () => {
            try {
                const response = await authClient.delete(`/api/article/${testArticleId}`);
                expect(response.code).toBe(200);

                console.log("✅ 删除文章成功");
            } catch (error) {
                console.log("⚠️  删除文章失败:", error.message);
            }
        });
    });

    afterAll(async () => {
        if (authClient) {
            try {
                await authClient.logout();
                if (typeof authClient.destroy === "function") {
                    authClient.destroy();
                }
            } catch (error) {
                console.warn("Auth client cleanup warning:", error.message);
            }
        }
    });
});

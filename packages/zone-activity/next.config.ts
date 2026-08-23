import type { NextConfig } from "next";

/**
 * zone 应用的全部微前端配置就这两行:
 * - basePath:本 zone 的页面都挂在 /activity 下,与目录登记的 pathPrefix 一致
 * - assetPrefix:静态资产走 /activity-static,与其他 zone 的资产互不冲突。
 *   约定 = pathPrefix + "-static",主 zone 生成 rewrites 时依赖这个约定
 */
const nextConfig: NextConfig = {
    basePath: "/activity",
    assetPrefix: "/activity-static",
    reactStrictMode: true,
};

export default nextConfig;

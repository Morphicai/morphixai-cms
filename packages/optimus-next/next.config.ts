import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Multi-Zones 路由在 src/proxy.ts(TTL 拉服务目录,登记/启停约 1 分钟生效);
  // 平台 API 走 API Routes 代理(正确处理 httpOnly cookies)

  // 开发环境下的额外配置
  ...(process.env.NODE_ENV === 'development' && {
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            {
              key: 'Access-Control-Allow-Credentials',
              value: 'true',
            },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;

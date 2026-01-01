import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 临时禁用严格模式来调试无限循环问题
  reactStrictMode: false,
  
  // 移除 rewrites 配置，现在使用 API Routes 处理代理
  // 这样可以正确处理 httpOnly cookies 和认证
  
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

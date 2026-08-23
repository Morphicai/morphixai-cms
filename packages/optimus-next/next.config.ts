import type { NextConfig } from "next";

const API_BASE = (process.env.OPTIMUS_API_URL || "http://localhost:8084/api").replace(/\/$/, "");

/**
 * Multi-Zones:主 zone 启动时从服务目录拉 zone 路由表生成 rewrites。
 * "管理后台管控"的落点在这——zone 在服务状态页登记/启停,重启本应用即生效,
 * 不改一行代码。目录打不通时回退空表(主站自身路径不受影响,只是 zone 入口
 * 暂不可达),启动决不因目录故障失败。
 * 每个 zone 三条:裸前缀、前缀子路径、静态资产(assetPrefix 约定 = 前缀+"-static")。
 */
async function zoneRewrites() {
  try {
    const res = await fetch(`${API_BASE}/public/zone-routes`, {
      signal: AbortSignal.timeout(3000),
    });
    const json: any = await res.json();
    const zones: Array<{ key: string; pathPrefix: string; baseUrl: string }> =
      json?.code === 200 && Array.isArray(json.data) ? json.data : [];
    if (zones.length) {
      console.log(`[zones] 已装载 ${zones.length} 个 zone: ${zones.map((z) => `${z.pathPrefix}→${z.baseUrl}`).join(", ")}`);
    }
    return zones.flatMap((z) => {
      const base = z.baseUrl.replace(/\/$/, "");
      return [
        { source: z.pathPrefix, destination: `${base}${z.pathPrefix}` },
        { source: `${z.pathPrefix}/:path*`, destination: `${base}${z.pathPrefix}/:path*` },
        { source: `${z.pathPrefix}-static/:path*`, destination: `${base}${z.pathPrefix}-static/:path*` },
      ];
    });
  } catch (e: any) {
    console.warn(`[zones] 服务目录不可达,zone 路由表为空: ${e?.message ?? e}`);
    return [];
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 平台 API 走 API Routes 代理(正确处理 httpOnly cookies);
  // 这里的 rewrites 只服务 Multi-Zones 路径分区
  async rewrites() {
    return zoneRewrites();
  },

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

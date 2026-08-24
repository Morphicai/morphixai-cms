import { NextResponse, NextRequest } from 'next/server';

/**
 * proxy 承担两件事:demo 页生产隔离 + Multi-Zones 动态路由。
 *
 * zone 路由为什么在这不在 next.config:rewrites() 只在进程启动时执行一次,
 * 面板登记/启停 zone 都得重启主站才生效。放 proxy 里按 TTL 拉服务目录,
 * 变更约 1 分钟内生效,"管理后台管控"才算闭环。
 * matcher 因此从窄列表放宽为排除式——zone 前缀是运行时数据,没法写死。
 */

const DEBUG_PREFIXES = [
  '/debug-login',
  '/api-test',
  '/api-examples',
  '/business-demo',
  '/auth-modal-demo',
  '/design-system-demo',
  '/components',
  '/examples',
];

const API_BASE = (process.env.OPTIMUS_API_URL || 'http://localhost:8084/api').replace(/\/$/, '');
const ZONE_TTL_MS = 60_000;

type ZoneRoute = { key: string; pathPrefix: string; baseUrl: string };

let zoneCache: { routes: ZoneRoute[]; fetchedAt: number } | null = null;
let inflight: Promise<ZoneRoute[]> | null = null;

async function fetchZoneRoutes(): Promise<ZoneRoute[]> {
  const res = await fetch(`${API_BASE}/public/zone-routes`, {
    signal: AbortSignal.timeout(3000),
  });
  const json: any = await res.json();
  const routes: ZoneRoute[] = json?.code === 200 && Array.isArray(json.data) ? json.data : [];
  zoneCache = { routes, fetchedAt: Date.now() };
  return routes;
}

/**
 * stale-while-revalidate:有旧表直接用(过期就后台刷),没表才阻塞等一次。
 * 目录不可达时沿用旧表——zone 路由宁可旧一分钟,不能因目录抖动断流量。
 */
async function getZoneRoutes(): Promise<ZoneRoute[]> {
  const fresh = zoneCache && Date.now() - zoneCache.fetchedAt < ZONE_TTL_MS;
  if (zoneCache && fresh) return zoneCache.routes;
  if (!inflight) {
    inflight = fetchZoneRoutes()
      .catch(() => zoneCache?.routes ?? [])
      .finally(() => { inflight = null; });
  }
  if (zoneCache) return zoneCache.routes; // 旧表先顶上,刷新在后台跑
  return inflight;
}

function matchZone(pathname: string, routes: ZoneRoute[]): ZoneRoute | undefined {
  return routes.find((z) => {
    const p = z.pathPrefix;
    return (
      pathname === p ||
      pathname.startsWith(`${p}/`) ||
      pathname.startsWith(`${p}-static/`) // assetPrefix 约定 = 前缀 + "-static"
    );
  });
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (process.env.NODE_ENV !== 'development') {
    const isDebugPath = DEBUG_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (isDebugPath) {
      // rewrite 到不存在的路径,走 Next 的标准 404 渲染
      return NextResponse.rewrite(new URL('/__blocked', request.url));
    }
  }

  const zone = matchZone(pathname, await getZoneRoutes());
  if (zone) {
    const base = zone.baseUrl.replace(/\/$/, '');
    return NextResponse.rewrite(new URL(`${base}${pathname}${search}`));
  }

  return NextResponse.next();
}

export const config = {
  // 排除主站自身静态资源与 API 代理;zone 的静态资产是 /<前缀>-static/... 不受影响。
  // 其余请求进来也只是查一次内存表,未命中即放行
  matcher: ['/((?!_next/|favicon.ico|api/).*)'],
};

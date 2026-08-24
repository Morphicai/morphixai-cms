/**
 * C 端 API 代理(app/api/[...path]/route.ts)按 TTL 拉服务目录的 API 路由表,
 * 与 src/proxy.ts 的 zone 路由表是同构但独立的两份缓存——分属 edge/node 两个运行时,
 * 状态不共享,逻辑抽成公共模块只是省得再抄一遍 TTL/降级细节。
 */

const API_BASE = (process.env.OPTIMUS_API_URL || 'http://localhost:8084/api').replace(/\/$/, '');
const TTL_MS = 60_000;

export type ApiRoute = { key: string; prefix: string; baseUrl: string };

let cache: { routes: ApiRoute[]; fetchedAt: number } | null = null;
let inflight: Promise<ApiRoute[]> | null = null;

async function fetchApiRoutes(): Promise<ApiRoute[]> {
  const res = await fetch(`${API_BASE}/public/api-routes`, {
    signal: AbortSignal.timeout(3000),
  });
  const json: any = await res.json();
  const routes: ApiRoute[] = json?.code === 200 && Array.isArray(json.data) ? json.data : [];
  cache = { routes, fetchedAt: Date.now() };
  return routes;
}

/**
 * stale-while-revalidate,和 zone 路由表同一套策略:目录不可达时沿用旧表/空表,
 * 代理宁可路由信息旧一分钟,也不能因为目录服务抖动就整体 500
 */
export async function getApiRoutes(): Promise<ApiRoute[]> {
  const fresh = cache && Date.now() - cache.fetchedAt < TTL_MS;
  if (cache && fresh) return cache.routes;
  if (!inflight) {
    inflight = fetchApiRoutes()
      .catch(() => cache?.routes ?? [])
      .finally(() => { inflight = null; });
  }
  if (cache) return cache.routes;
  return inflight;
}

/** 最长前缀匹配优先,避免 /biz 和 /biz/partner 同时登记时命中顺序不确定 */
export function matchApiRoute(apiPath: string, routes: ApiRoute[]): ApiRoute | undefined {
  let best: ApiRoute | undefined;
  for (const r of routes) {
    const hit = apiPath === r.prefix || apiPath.startsWith(`${r.prefix}/`);
    if (hit && (!best || r.prefix.length > best.prefix.length)) best = r;
  }
  return best;
}

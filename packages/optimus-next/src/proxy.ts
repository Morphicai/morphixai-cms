import { NextResponse, NextRequest } from 'next/server';

/**
 * demo/debug 页生产隔离
 *
 * 这批页面是开发期真实在用的调试工具（api-examples 是全接口点测台，
 * debug-login 带固定测试账号），不删，但绝不能和官网一起对外——
 * 非开发环境一律 404。新增调试页记得把前缀加进来。
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

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    const { pathname } = request.nextUrl;
    const isDebugPath = DEBUG_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (isDebugPath) {
      // rewrite 到不存在的路径，走 Next 的标准 404 渲染
      return NextResponse.rewrite(new URL('/__blocked', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/debug-login/:path*',
    '/api-test/:path*',
    '/api-examples/:path*',
    '/business-demo/:path*',
    '/auth-modal-demo/:path*',
    '/design-system-demo/:path*',
    '/components/:path*',
    '/examples/:path*',
    '/debug-login',
    '/api-test',
    '/api-examples',
    '/business-demo',
    '/auth-modal-demo',
    '/design-system-demo',
    '/components',
    '/examples',
  ],
};

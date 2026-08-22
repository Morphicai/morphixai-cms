import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * 通用 API 代理路由
 * 把 /api/* 原样转发到业务后台，并把后台的 Set-Cookie 转发回浏览器。
 *
 * 认证策略：token 的签发、续期、清除全部由后台的 httpOnly cookie 完成
 * （client-user 的 login/refresh/logout 自己写 cookie，守卫自己从 cookie 读），
 * 代理只做两件事——透传请求 cookie、转发响应 Set-Cookie。
 * 早前版本在这里自己解析响应体再造 cookie，结果解析的字段层级和登录接口的
 * 实际返回对不上，cookie 从来没设上过；教训是代理别替后台实现认证语义。
 */

const OPTIMUS_API_URL = process.env.OPTIMUS_API_URL || 'http://localhost:8084/api';

async function handleRequest(request: NextRequest, method: string) {
  try {
    const { pathname, search } = new URL(request.url);
    const apiPath = pathname.replace('/api', '');
    const cookieStore = await cookies();

    const backendUrl = `${OPTIMUS_API_URL}${apiPath}${search}`;

    // 透传 headers（排除逐跳头）
    const forwardHeaders: Record<string, string> = {};
    const excludeHeaders = ['host', 'connection', 'content-length'];
    request.headers.forEach((value, key) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        forwardHeaders[key] = value;
      }
    });

    // 透传 cookies（httpOnly 的认证 cookie 就在这里面）
    const allCookies = cookieStore.getAll();
    if (allCookies.length > 0) {
      forwardHeaders.Cookie = allCookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join('; ');
    }

    // 请求体：只能读一次，统一按文本读（JSON 字符串原样透传即可）。
    // 之前先 json() 失败再 text() 的写法，在空 body 的 POST 上必炸——
    // json() 抛错时流已被消费，二次读直接 "Body is unusable"
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const raw = await request.text();
      body = raw.length > 0 ? raw : undefined;
    }

    const response = await fetch(backendUrl, {
      method,
      headers: forwardHeaders,
      body,
    });

    let responseData: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = { data: await response.text() };
    }

    const nextResponse = NextResponse.json(responseData, {
      status: response.status,
      statusText: response.statusText,
    });

    // 转发后台的 Set-Cookie（登录/续期/登出的 httpOnly cookie 由此到达浏览器）
    for (const cookie of response.headers.getSetCookie()) {
      nextResponse.headers.append('set-cookie', cookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('[API Proxy] 处理异常:', error);
    return NextResponse.json(
      { code: 500, message: '代理服务器错误', data: null },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE');
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, 'PATCH');
}

export async function OPTIONS(request: NextRequest) {
  return handleRequest(request, 'OPTIONS');
}

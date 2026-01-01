import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * 通用 API 代理路由
 * 处理所有 /api/* 请求，自动转发到业务后台并正确处理 httpOnly cookies
 */

const OPTIMUS_API_URL = process.env.OPTIMUS_API_URL || 'http://localhost:8084/api';

/**
 * 需要设置 Cookie 的登录相关接口
 */
const LOGIN_ENDPOINTS = [
  '/client-user/login',
  '/client-user/refresh',
];

/**
 * 需要清除 Cookie 的登出相关接口
 */
const LOGOUT_ENDPOINTS = [
  '/client-user/logout',
];

/**
 * 需要额外 Authorization header 支持的接口
 * (当没有 Authorization header 时，从 cookie 中提取 token)
 */
const AUTH_FALLBACK_PATTERNS = [
  /^\/client-user\/me$/,
  /^\/client-user\/profile$/,
  /^\/client-user\/external-accounts$/,
  /^\/biz\//,  // 所有业务接口
];

/**
 * 检查是否需要 Authorization header 备用支持
 */
function needsAuthFallback(path: string): boolean {
  return AUTH_FALLBACK_PATTERNS.some(pattern => pattern.test(path));
}

/**
 * 设置认证 Cookie
 */
function setAuthCookies(response: NextResponse, data: any) {
  if (data.data && data.data.accessToken) {
    response.cookies.set('clientAccessToken', data.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60, // 2小时
      path: '/',
    });

    if (data.data.refreshToken) {
      response.cookies.set('clientRefreshToken', data.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7天
        path: '/',
      });
    }
    
    console.log('🍪 [API Proxy] 已设置认证 cookies');
  }
}

/**
 * 清除认证 Cookie
 */
function clearAuthCookies(response: NextResponse) {
  response.cookies.set('clientAccessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  response.cookies.set('clientRefreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  
  console.log('🍪 [API Proxy] 已清除认证 cookies');
}

/**
 * 通用请求处理函数
 */
async function handleRequest(request: NextRequest, method: string) {
  try {
    const { pathname, search } = new URL(request.url);
    const apiPath = pathname.replace('/api', '');
    const cookieStore = await cookies();
    
    console.log(`🔍 [API Proxy] ${method} ${apiPath}${search}`);
    
    // 构建转发 URL
    const backendUrl = `${OPTIMUS_API_URL}${apiPath}${search}`;
    
    // 构建转发 headers - 默认透传所有 headers
    const forwardHeaders: Record<string, string> = {};
    
    // 复制原始请求的所有 headers（排除一些系统级的）
    const excludeHeaders = ['host', 'connection', 'content-length'];
    request.headers.forEach((value, key) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        forwardHeaders[key] = value;
      }
    });
    
    // 默认透传所有 cookies - 构建 Cookie header
    const allCookies = await cookieStore.getAll();
    if (allCookies.length > 0) {
      const cookieHeader = allCookies
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ');
      forwardHeaders.Cookie = cookieHeader;
      console.log('🍪 [API Proxy] 透传所有 cookies:', allCookies.map(c => c.name).join(', '));
    }
    
    // 额外处理：如果需要认证但没有 Authorization header，从 cookie 中提取 token
    if (needsAuthFallback(apiPath) && !request.headers.get('authorization')) {
      const clientAccessToken = cookieStore.get('clientAccessToken')?.value;
      if (clientAccessToken) {
        forwardHeaders.Authorization = `Bearer ${clientAccessToken}`;
        console.log('🔑 [API Proxy] 从 cookie 提取 token 作为 Authorization header');
      } else {
        console.warn('⚠️ [API Proxy] 需要认证但未找到 token');
      }
    }
    
    // 处理请求体
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const requestBody = await request.json();
        body = JSON.stringify(requestBody);
      } catch {
        // 如果不是 JSON，尝试读取为文本
        body = await request.text();
      }
    }
    
    console.log('🚀 [API Proxy] 转发到:', backendUrl);
    console.log('📋 [API Proxy] 转发 headers:', Object.keys(forwardHeaders).join(', '));
    if (forwardHeaders.Cookie) {
      console.log('🍪 [API Proxy] 转发 cookies:', forwardHeaders.Cookie.split('; ').map(c => c.split('=')[0]).join(', '));
    }
    
    // 转发请求到业务后台
    const response = await fetch(backendUrl, {
      method,
      headers: forwardHeaders,
      body,
    });
    
    console.log('📡 [API Proxy] 业务后台响应状态:', response.status);
    
    // 读取响应数据
    let responseData: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const textData = await response.text();
      responseData = { data: textData };
    }
    
    // 创建响应
    const nextResponse = NextResponse.json(responseData, {
      status: response.status,
      statusText: response.statusText,
    });
    
    // 处理特殊接口的 Cookie 操作
    if (response.ok) {
      // 登录成功，设置 cookies
      if (LOGIN_ENDPOINTS.includes(apiPath) && responseData.code === 200) {
        setAuthCookies(nextResponse, responseData);
      }
      
      console.log('✅ [API Proxy] 请求成功');
    } else {
      console.error('❌ [API Proxy] 请求失败:', response.status, response.statusText);
    }
    
    // 登出接口，清除 cookies（无论成功失败都清除）
    if (LOGOUT_ENDPOINTS.includes(apiPath)) {
      clearAuthCookies(nextResponse);
    }
    
    return nextResponse;
    
  } catch (error) {
    console.error('💥 [API Proxy] 处理异常:', error);
    return NextResponse.json(
      { code: 500, message: '代理服务器错误', data: null },
      { status: 500 }
    );
  }
}

// 导出各种 HTTP 方法的处理函数
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
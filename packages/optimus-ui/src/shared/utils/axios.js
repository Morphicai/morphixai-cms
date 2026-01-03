import axios from "axios";
import { message } from "antd";
import storage from "./storage";
import { refreshToken } from "../../apis/user";
console.log('🔧 Axios配置 - API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);

// 全局刷新token的状态管理（防止并发刷新）
let isRefreshingToken = false;
let refreshTokenPromise = null;
let hasShownAuthError = false; // 防止重复显示错误提示

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  transformResponse: [
    function (dataStr) {
      try {
        console.log('🔄 [Axios Transform] 原始响应字符串:', dataStr?.substring(0, 200));
        
        const parsed = JSON.parse(dataStr);
        
        // 兼容两种响应格式：
        // 1. 旧格式: { code: 200, data: {...}, msg: '...' }
        // 2. 新格式: { success: true, data: {...}, msg: '...' }
        let success, code, data, msg, error;
        
        if ('success' in parsed) {
          // 新格式：使用 success 字段
          success = parsed.success;
          code = success ? 200 : (parsed.code || 0);
          data = parsed.data || {};
          msg = parsed.msg;
          error = parsed.error;
        } else {
          // 旧格式：使用 code 字段
          code = parsed.code || 0;
          success = code === 200;
          data = parsed.data || {};
          msg = parsed.msg;
          error = parsed.error;
        }
        
        console.log('🔄 [Axios Transform] 解析后数据:', {
          originalSuccess: parsed.success,
          originalCode: parsed.code,
          finalSuccess: success,
          finalCode: code,
          hasData: !!data,
          dataType: typeof data,
          dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
          msg,
          hasError: !!error,
        });
        
        // 登录成功了
        if (success && data?.accessToken) {
          storage("access-token", data.accessToken);
          storage("refresh-token", data.refreshToken);
          hasShownAuthError = false; // 重置错误提示标志
        }
        
        const transformed = { success, code, data, msg, error };
        console.log('🔄 [Axios Transform] 转换后结果:', {
          success: transformed.success,
          code: transformed.code,
          hasData: !!transformed.data,
        });
        
        return transformed;
      } catch (error) {
        console.error('❌ [Axios Transform] 解析失败:', error);
        return {
          success: false,
          code: -100,
          data: null,
          msg: "请求失败",
        };
      }
    },
  ],
});
export async function request(
  { type = "get", data = {}, showTip = true, url, headers = {} },
  isRetry = false,
) {
  console.log('🌐 [Axios] HTTP请求:', {
    method: type.toUpperCase(),
    url,
    params: type.toLowerCase() === "get" ? data : {},
    body: type.toLowerCase() !== "get" ? data : {},
    isRetry,
  });

  let result = {};

  try {
    let { data: responseData, status } = await axiosInstance.request({
      method: type,
      url: url,
      params: type.toLowerCase() === "get" ? data : {},
      data: type.toLowerCase() !== "get" ? data : {},
      headers: {
        Authorization: storage("access-token") || "",
        ...headers,
      },
    });

    console.log('🌐 [Axios] 原始响应:', {
      status,
      responseData,
      hasData: !!responseData,
      dataType: typeof responseData,
      dataKeys: responseData ? Object.keys(responseData) : [],
    });

    if (responseData && status) {
      result = responseData;
    } else {
      result = { code: -100, msg: "网络请求失败！" };
    }

    console.log('🌐 [Axios] 处理后结果:', {
      status,
      success: result.success,
      code: result.code,
      hasData: !!result.data,
      dataType: typeof result.data,
      msg: result.msg,
    });

    if (showTip && result.msg && result.code !== 200) {
      if (result.error) {
        result.error.some((errorItem) => {
          message.error(errorItem);
          return true;
        });
      } else {
        message.error(result.msg || "请求失败");
      }
    }
    return result;
  } catch (error) {
    let { status, data = {} } = error?.response || {};
    
    // 对于失败的请求，返回明确的失败状态，不进行缓存
    const failedResponse = {
      success: false,
      code: status || -100,
      data: null,
      msg: data.msg || "请求失败",
      error: data.error
    };

    // 统一错误处理
    if (status === 401) {
      // 401 未授权 - 尝试刷新token
      const isRefreshTokenUrl = /update\/token/.test(url);
      
      // 如果是刷新token的请求本身返回401，说明refresh token也过期了
      if (isRefreshTokenUrl) {
        console.log('🔒 [Auth] Refresh token 已过期，清除认证信息');
        storage("access-token", "");
        storage("refresh-token", "");
        storage("user", "");
        isRefreshingToken = false;
        refreshTokenPromise = null;
        
        // 只显示一次错误提示
        if (!hasShownAuthError) {
          hasShownAuthError = true;
          if (showTip) {
            message.error("登录已过期，请重新登录");
          }
          // 触发登录状态变更事件，让App.js跳转到登录页
          setTimeout(() => {
            window.dispatchEvent(new Event('setItemEvent'));
          }, 100);
        }
        
        return failedResponse;
      }
      
      // 如果已经是重试请求还是401，不再重试
      if (isRetry) {
        console.log('🔒 [Auth] 重试后仍然401，停止重试');
        storage("access-token", "");
        storage("refresh-token", "");
        storage("user", "");
        isRefreshingToken = false;
        refreshTokenPromise = null;
        
        if (!hasShownAuthError) {
          hasShownAuthError = true;
          if (showTip) {
            message.error("登录已过期，请重新登录");
          }
          setTimeout(() => {
            window.dispatchEvent(new Event('setItemEvent'));
          }, 100);
        }
        
        return failedResponse;
      }
      
      // 检查是否有refresh token
      const currentRefreshToken = storage("refresh-token");
      if (!currentRefreshToken) {
        console.log('🔒 [Auth] 没有refresh token，无法刷新');
        storage("access-token", "");
        storage("user", "");
        
        if (!hasShownAuthError) {
          hasShownAuthError = true;
          if (showTip) {
            message.error("登录已过期，请重新登录");
          }
          setTimeout(() => {
            window.dispatchEvent(new Event('setItemEvent'));
          }, 100);
        }
        
        return failedResponse;
      }
      
      // 使用全局锁防止并发刷新
      if (isRefreshingToken && refreshTokenPromise) {
        console.log('🔄 [Auth] 等待正在进行的token刷新...');
        try {
          await refreshTokenPromise;
          // 刷新完成后重试原请求
          const newToken = storage("access-token");
          if (newToken) {
            console.log('🔄 [Auth] Token刷新成功，重试原请求');
            return await request(arguments[0], true);
          } else {
            console.log('🔒 [Auth] Token刷新失败');
            return failedResponse;
          }
        } catch (err) {
          console.error('🔒 [Auth] 等待token刷新失败:', err);
          return failedResponse;
        }
      }
      
      // 开始刷新token
      isRefreshingToken = true;
      console.log('🔄 [Auth] 开始刷新token...');
      
      refreshTokenPromise = (async () => {
        try {
          const refreshResult = await refreshToken();
          
          if (refreshResult?.success && refreshResult?.data?.accessToken) {
            console.log('✅ [Auth] Token刷新成功');
            hasShownAuthError = false; // 重置错误提示标志
            return refreshResult;
          } else {
            console.log('❌ [Auth] Token刷新失败:', refreshResult?.msg);
            // 刷新失败，清除所有认证信息
            storage("access-token", "");
            storage("refresh-token", "");
            storage("user", "");
            
            if (!hasShownAuthError) {
              hasShownAuthError = true;
              if (showTip) {
                message.error(refreshResult?.msg || "登录已过期，请重新登录");
              }
              setTimeout(() => {
                window.dispatchEvent(new Event('setItemEvent'));
              }, 100);
            }
            
            return null;
          }
        } catch (refreshError) {
          console.error('❌ [Auth] Token刷新异常:', refreshError);
          storage("access-token", "");
          storage("refresh-token", "");
          storage("user", "");
          
          if (!hasShownAuthError) {
            hasShownAuthError = true;
            if (showTip) {
              message.error("登录已过期，请重新登录");
            }
            setTimeout(() => {
              window.dispatchEvent(new Event('setItemEvent'));
            }, 100);
          }
          
          return null;
        } finally {
          isRefreshingToken = false;
          refreshTokenPromise = null;
        }
      })();
      
      const refreshResult = await refreshTokenPromise;
      
      if (refreshResult?.data?.accessToken) {
        // 刷新成功，重试原请求
        return await request(arguments[0], true);
      } else {
        // 刷新失败
        return failedResponse;
      }
    } else if (status === 403) {
      // 403 禁止访问
      if (showTip) {
        message.error(data.msg || "无权访问，请联系管理员");
      }
      return failedResponse;
    } else if (status === 404) {
      // 404 资源不存在
      if (showTip) {
        message.error(data.msg || "请求的资源不存在");
      }
      return failedResponse;
    } else if (status === 409) {
      // 409 数据冲突
      if (showTip) {
        message.error(data.msg || "数据冲突，请检查输入");
      }
      return failedResponse;
    } else if (status === 400) {
      // 400 请求参数错误
      if (showTip) {
        message.error(data.msg || "请求参数错误");
      }
      return failedResponse;
    } else if (status === 500) {
      // 500 服务器错误
      if (showTip) {
        message.error(data.msg || "服务器错误，请稍后重试");
      }
      return failedResponse;
    }
    
    // 其他错误情况的通用处理
    if (showTip) {
      if (typeof data.error === "object" && Array.isArray(data.error)) {
        // 显示第一个错误信息
        data.error.some((errorItem) => {
          message.error(errorItem);
          return true;
        });
      } else if (data.msg) {
        message.error(data.msg);
      } else {
        message.error("请求失败，请稍后重试");
      }
    }
    
    return failedResponse;
  }
}
export default axiosInstance;

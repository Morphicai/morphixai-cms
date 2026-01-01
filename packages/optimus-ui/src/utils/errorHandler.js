import { message } from 'antd';
import { ERROR_MESSAGES } from '../constants/errorCodes';

/**
 * 统一的 API 错误处理函数
 * @param {Object} error - 错误对象或响应对象
 * @param {Object} options - 配置选项
 * @param {boolean} options.showMessage - 是否显示错误提示，默认 true
 * @param {string} options.defaultMessage - 默认错误消息
 * @param {Function} options.onError - 自定义错误处理回调
 * @returns {Object} 处理后的错误信息
 */
export function handleApiError(error, options = {}) {
  const {
    showMessage: shouldShowMessage = true,
    defaultMessage = '操作失败，请稍后重试',
    onError,
  } = options;

  // 提取错误信息
  const errorInfo = extractErrorInfo(error);

  // 显示错误提示
  if (shouldShowMessage) {
    const displayMessage = errorInfo.message || defaultMessage;
    message.error(displayMessage);
  }

  // 执行自定义错误处理
  if (onError && typeof onError === 'function') {
    onError(errorInfo);
  }

  // 返回错误信息供调用方使用
  return errorInfo;
}

/**
 * 从错误对象中提取错误信息
 * @param {Object} error - 错误对象
 * @returns {Object} 错误信息
 */
function extractErrorInfo(error) {
  // 默认错误信息
  const errorInfo = {
    code: null,
    message: null,
    data: null,
    success: false,
  };

  // 如果是响应对象（来自 axios）
  if (error && typeof error === 'object') {
    // 检查是否有 code 字段
    if (error.code !== undefined) {
      errorInfo.code = error.code;
      
      // 优先使用后端返回的消息
      if (error.msg) {
        errorInfo.message = error.msg;
      } 
      // 如果后端没有返回消息，使用本地错误码映射
      else if (ERROR_MESSAGES[error.code]) {
        errorInfo.message = ERROR_MESSAGES[error.code];
      }
    }

    // 保存错误数据
    if (error.data !== undefined) {
      errorInfo.data = error.data;
    }

    // 保存 success 状态
    if (error.success !== undefined) {
      errorInfo.success = error.success;
    }

    // 处理 error 数组（多个错误消息）
    if (Array.isArray(error.error) && error.error.length > 0) {
      errorInfo.message = error.error[0]; // 显示第一个错误
      errorInfo.errors = error.error; // 保存所有错误
    }
  }

  return errorInfo;
}

/**
 * 创建带错误处理的 API 调用包装器
 * @param {Function} apiCall - API 调用函数
 * @param {Object} errorOptions - 错误处理选项
 * @returns {Function} 包装后的函数
 */
export function withErrorHandler(apiCall, errorOptions = {}) {
  return async function (...args) {
    try {
      const response = await apiCall(...args);
      
      // 检查响应是否成功
      if (response && response.success === false) {
        handleApiError(response, errorOptions);
        return response;
      }
      
      return response;
    } catch (error) {
      // 处理网络错误或其他异常
      const errorInfo = handleApiError(error, {
        ...errorOptions,
        defaultMessage: '网络请求失败，请检查网络连接',
      });
      
      // 返回错误响应格式
      return {
        success: false,
        code: errorInfo.code || -1,
        msg: errorInfo.message,
        data: null,
      };
    }
  };
}

/**
 * 检查响应是否成功
 * @param {Object} response - API 响应对象
 * @returns {boolean} 是否成功
 */
export function isSuccess(response) {
  return response && response.success === true && response.code === 200;
}

/**
 * 获取错误消息
 * @param {number} code - 错误码
 * @param {string} defaultMessage - 默认消息
 * @returns {string} 错误消息
 */
export function getErrorMessage(code, defaultMessage = '操作失败') {
  return ERROR_MESSAGES[code] || defaultMessage;
}

/**
 * 批量处理错误（用于批量操作）
 * @param {Array} errors - 错误数组
 * @param {Object} options - 配置选项
 */
export function handleBatchErrors(errors, options = {}) {
  const { showMessage: shouldShowMessage = true } = options;

  if (!Array.isArray(errors) || errors.length === 0) {
    return;
  }

  if (shouldShowMessage) {
    // 如果只有一个错误，直接显示
    if (errors.length === 1) {
      message.error(errors[0]);
    } else {
      // 多个错误，显示汇总信息
      message.error(`操作失败：${errors.length} 个错误`);
      
      // 可选：在控制台输出详细错误
      console.error('批量操作错误：', errors);
    }
  }
}

const errorHandler = {
  handleApiError,
  withErrorHandler,
  isSuccess,
  getErrorMessage,
  handleBatchErrors,
};

export default errorHandler;

import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * useNavigateBack - 通用返回导航 Hook
 * 
 * 优先使用浏览器历史记录返回上一页
 * 如果没有历史记录，则跳转到指定的兜底页面
 * 
 * @param {string} fallbackPath - 兜底路径，当没有历史记录时跳转到此路径
 * @returns {Function} navigateBack - 返回函数
 * 
 * @example
 * const navigateBack = useNavigateBack('/articles');
 * navigateBack(); // 优先返回上一页，否则跳转到 /articles
 */
export const useNavigateBack = (fallbackPath = '/') => {
  const navigate = useNavigate();

  const navigateBack = useCallback(() => {
    // 检查是否有历史记录
    if (window.history.length > 1) {
      // 有历史记录，返回上一页
      navigate(-1);
    } else {
      // 没有历史记录，跳转到兜底页面
      navigate(fallbackPath, { replace: true });
    }
  }, [navigate, fallbackPath]);

  return navigateBack;
};

export default useNavigateBack;

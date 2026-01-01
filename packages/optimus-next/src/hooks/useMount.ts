import { useEffect } from 'react';

/**
 * 组件挂载时执行的 Hook
 * 遵循开发规范，替代空依赖的 useEffect
 */
export function useMount(fn: () => void) {
  useEffect(() => {
    fn();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * 组件卸载时执行的 Hook
 */
export function useUnmount(fn: () => void) {
  useEffect(() => {
    return fn;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
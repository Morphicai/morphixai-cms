import { useEffect, useRef } from 'react';

/**
 * useUnmount - 组件卸载时执行回调
 * 
 * @param {Function} fn - 卸载时执行的回调函数
 * 
 * @example
 * useUnmount(() => {
 *   console.log('Component will unmount');
 *   cleanup();
 * });
 */
const useUnmount = (fn) => {
  const fnRef = useRef(fn);

  // 保持 fnRef 最新
  fnRef.current = fn;

  useEffect(() => {
    return () => {
      if (typeof fnRef.current === 'function') {
        fnRef.current();
      }
    };
  }, []);
};

export default useUnmount;

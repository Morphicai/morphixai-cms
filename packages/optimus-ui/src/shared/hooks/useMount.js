import { useEffect } from 'react';

/**
 * useMount - 组件挂载时执行回调
 * 
 * @param {Function} fn - 挂载时执行的回调函数
 * 
 * @example
 * useMount(() => {
 *   console.log('Component mounted');
 *   fetchData();
 * });
 */
const useMount = (fn) => {
  useEffect(() => {
    if (typeof fn === 'function') {
      fn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default useMount;

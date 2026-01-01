import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import CategoryService from '../../services/CategoryService';
import useAuth from '../hooks/useAuth';

const CategoryContext = createContext();

/**
 * CategoryProvider - 分类数据全局提供者
 */
export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // 获取分类列表
  const fetchCategories = useCallback(async () => {
    // 只在认证完成后才获取分类数据
    if (!isAuthenticated) {
      console.log('用户未认证，跳过分类数据获取');
      return;
    }

    setLoading(true);
    try {
      const response = await CategoryService.list({ tree: true });
      
      if (response.success && response.data) {
        // 后端返回的数据在 data.categories 中
        const items = response.data.categories || response.data.items || [];
        setCategories(items);
      } else {
        console.error('获取分类列表失败:', response);
        setCategories([]);
      }
    } catch (error) {
      console.error('获取分类列表异常:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // 监听认证状态变化，只在认证完成后获取分类
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    } else {
      // 未认证时清空分类数据
      setCategories([]);
    }
  }, [isAuthenticated, fetchCategories]);

  const value = {
    categories,
    loading,
    refetch: fetchCategories
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

/**
 * useCategories - 使用分类数据的Hook
 */
export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within CategoryProvider');
  }
  return context;
};

export default CategoryContext;

import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import CategoryService from '../../../services/CategoryService';
import { isSuccess } from '../../../utils/errorHandler';

/**
 * 分类树管理 Hook
 * 管理分类列表状态和操作
 */
export const useCategoryTree = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);

  /**
   * 加载分类数据
   */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await CategoryService.list({ tree: true });
      
      if (isSuccess(response)) {
        // 后端返回的数据结构是 { categories: [], total: number }
        const items = response.data?.categories || [];
        setCategories(items);
        // 默认展开所有节点
        const allKeys = extractAllKeys(items);
        setExpandedKeys(allKeys);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
      message.error('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 提取所有分类的key用于展开
   */
  const extractAllKeys = (items) => {
    const keys = [];
    const traverse = (nodes) => {
      nodes.forEach(node => {
        keys.push(node.id.toString());
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(items);
    return keys;
  };

  /**
   * 创建分类
   */
  const createCategory = useCallback(async (data) => {
    try {
      const response = await CategoryService.create(data);
      
      if (isSuccess(response)) {
        message.success('创建分类成功');
        await fetchCategories();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('创建分类失败:', error);
      return null;
    }
  }, [fetchCategories]);

  /**
   * 更新分类
   */
  const updateCategory = useCallback(async (id, data) => {
    try {
      const response = await CategoryService.update(id, data);
      
      if (isSuccess(response)) {
        message.success('更新分类成功');
        await fetchCategories();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('更新分类失败:', error);
      return null;
    }
  }, [fetchCategories]);

  /**
   * 删除分类
   */
  const deleteCategory = useCallback(async (id) => {
    try {
      const response = await CategoryService.delete(id);
      
      if (isSuccess(response)) {
        message.success('删除分类成功');
        await fetchCategories();
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除分类失败:', error);
      return false;
    }
  }, [fetchCategories]);

  /**
   * 处理树节点展开/折叠
   */
  const handleExpand = useCallback((keys) => {
    setExpandedKeys(keys);
  }, []);

  /**
   * 处理树节点选择
   */
  const handleSelect = useCallback((keys, info) => {
    setSelectedKeys(keys);
  }, []);

  /**
   * 获取选中的分类
   */
  const getSelectedCategory = useCallback(() => {
    if (selectedKeys.length === 0) return null;
    
    const findCategory = (items, id) => {
      for (const item of items) {
        if (item.id.toString() === id) return item;
        if (item.children) {
          const found = findCategory(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findCategory(categories, selectedKeys[0]);
  }, [categories, selectedKeys]);

  /**
   * 清除选择
   */
  const clearSelection = useCallback(() => {
    setSelectedKeys([]);
  }, []);

  // 初始加载
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    expandedKeys,
    selectedKeys,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    handleExpand,
    handleSelect,
    getSelectedCategory,
    clearSelection
  };
};

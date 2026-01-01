import { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import debounce from 'lodash/debounce';
import ArticleService from '../../../services/ArticleService';
import { useMount } from '../../../shared/hooks';

/**
 * 文章列表管理 Hook
 * @param {number} categoryId - 可选的分类ID筛选
 * @returns {Object} 文章列表状态和操作方法
 */
export const useArticleList = (categoryId = null) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    categoryId,
    status: null,
    keyword: '',
  });
  const [sorter, setSorter] = useState({
    field: 'updateDate',
    order: 'DESC',
  });

  // 获取文章列表
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        sortBy: sorter.field,
        sortOrder: sorter.order,
      };

      // 添加筛选条件
      if (filters.categoryId) {
        params.categoryId = filters.categoryId;
      }
      if (filters.status) {
        params.status = filters.status;
      }

      let response;
      if (filters.keyword) {
        // 使用搜索接口
        response = await ArticleService.search(filters.keyword, params);
      } else {
        // 使用列表接口
        response = await ArticleService.list(params);
      }

      if (response.success) {
        setArticles(response.data.items || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total || 0,
        }));
      } else {
        message.error('获取文章列表失败');
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
      message.error('获取文章列表失败');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, filters.categoryId, filters.status, filters.keyword, sorter.field, sorter.order]);

  // 搜索处理（带防抖）
  const handleSearch = useCallback((keyword) => {
    setFilters((prev) => ({ ...prev, keyword }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  // 创建防抖搜索函数
  const debouncedSearch = useMemo(
    () =>
      debounce((keyword) => {
        handleSearch(keyword);
      }, 500),
    [handleSearch]
  );

  // 筛选处理
  const handleFilter = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  // 排序处理
  const handleSort = useCallback((field, order) => {
    setSorter({ field, order });
  }, []);

  // 分页处理
  const handlePageChange = useCallback((page, pageSize) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize,
    }));
  }, []);

  // 刷新列表
  const refresh = useCallback(() => {
    fetchArticles();
  }, [fetchArticles]);

  // 初始加载
  useMount(() => {
    fetchArticles();
  });

  return {
    articles,
    loading,
    pagination,
    filters,
    sorter,
    fetchArticles,
    handleSearch: debouncedSearch,
    handleFilter,
    handleSort,
    handlePageChange,
    refresh,
  };
};

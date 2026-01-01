import React from 'react';
import ArticleList from './views/ArticleList';

/**
 * 统一文章管理页面
 * 
 * 功能：
 * - 显示所有分类的文章
 * - 支持按分类筛选
 * - 支持搜索和状态筛选
 * - 内置工具栏（刷新、密度、列设置）
 * - 使用 ProTable 提供强大的表格功能
 * 
 * 需求: 3.1, 3.2, 3.3, 3.4
 */
const ArticleManagement = () => {
  return (
    <ArticleList
      categoryId={null}
      showCategoryFilter={true}
    />
  );
};

export default ArticleManagement;

/**
 * 新闻管理页面
 * 新闻的发布、编辑、删除等管理功能
 */

import CategoryArticles from '../articles/views/CategoryArticles';

/**
 * 新闻管理页面
 * 使用分类专属管理组件，预设为新闻分类
 */
const NewsManagement = () => {
  return <CategoryArticles categoryCode="news" />;
};

export default NewsManagement;
/**
 * 活动管理页面
 * 活动的创建、编辑、删除等管理功能
 */

import CategoryArticles from '../articles/views/CategoryArticles';

/**
 * 活动管理页面
 * 使用分类专属管理组件，预设为活动分类
 */
const ActivityManagement = () => {
  return <CategoryArticles categoryCode="activity" />;
};

export default ActivityManagement;
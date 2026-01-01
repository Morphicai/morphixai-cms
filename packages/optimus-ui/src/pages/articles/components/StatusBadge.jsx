import React from 'react';
import { Tag } from 'antd';

/**
 * 文章状态标签组件
 * @param {Object} props
 * @param {string} props.status - 文章状态: draft, published, archived
 * @param {string} props.scheduledAt - 预定发布时间
 */
const StatusBadge = ({ status, scheduledAt }) => {
  // 定时发布功能已隐藏，不再显示预定发布状态
  // if (scheduledAt && status === 'draft') {
  //   return <Tag color="blue">预定发布</Tag>;
  // }

  // 根据状态显示不同颜色的标签
  const statusConfig = {
    draft: { color: 'default', text: '草稿' },
    published: { color: 'success', text: '已发布' },
    archived: { color: 'warning', text: '已归档' },
  };

  const config = statusConfig[status] || { color: 'default', text: '未知' };

  return <Tag color={config.color}>{config.text}</Tag>;
};

export default StatusBadge;

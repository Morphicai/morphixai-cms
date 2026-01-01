import React from 'react';
import { Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

/**
 * 通用操作按钮组件
 * @param {Object} record - 当前行数据
 * @param {Function} onEdit - 编辑回调
 * @param {Function} onDelete - 删除回调
 * @param {Function} onView - 查看回调
 * @param {Boolean} showEdit - 是否显示编辑按钮
 * @param {Boolean} showDelete - 是否显示删除按钮
 * @param {Boolean} showView - 是否显示查看按钮
 * @param {Array} extraButtons - 额外的按钮配置
 */
const ActionButtons = ({
  record,
  onEdit,
  onDelete,
  onView,
  showEdit = true,
  showDelete = true,
  showView = false,
  extraButtons = []
}) => {
  return (
    <Space size="small">
      {showView && (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onView?.(record)}
        >
          查看
        </Button>
      )}
      {showEdit && (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onEdit?.(record)}
        >
          编辑
        </Button>
      )}
      {showDelete && (
        <Popconfirm
          title="确定要删除这条记录吗？"
          onConfirm={() => onDelete?.(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
          >
            删除
          </Button>
        </Popconfirm>
      )}
      {extraButtons.map((button, index) => (
        <Button
          key={index}
          type="link"
          size="small"
          icon={button.icon}
          onClick={() => button.onClick?.(record)}
          {...button.props}
        >
          {button.text}
        </Button>
      ))}
    </Space>
  );
};

export default ActionButtons;
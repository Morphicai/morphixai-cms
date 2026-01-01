import React, { useMemo } from 'react';
import { Tree, Dropdown, Modal, Tag, Space, Spin } from 'antd';
import { 
  FolderOutlined, 
  FolderOpenOutlined, 
  LockOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';

const { confirm } = Modal;

/**
 * 分类树组件
 * 显示分类层级结构，支持右键菜单操作
 */
const CategoryTree = ({
  categories,
  loading,
  expandedKeys,
  selectedKeys,
  onExpand,
  onSelect,
  onEdit,
  onDelete,
  onAddChild
}) => {
  /**
   * 构建树节点数据
   */
  const treeData = useMemo(() => {
    const buildTreeNodes = (items) => {
      if (!items || !Array.isArray(items)) {
        return [];
      }
      
      return items.map(item => {
        const isBuiltIn = item.isBuiltIn || false;
        const config = item.config || {};

        const node = {
          key: item.id.toString(),
          title: (
            <Space size="small" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span>{item.name}</span>
              {isBuiltIn && (
                <Tag color="blue" icon={<LockOutlined />} style={{ margin: 0 }}>
                  内置
                </Tag>
              )}
              <span style={{ fontSize: '12px', opacity: 0.65, whiteSpace: 'nowrap' }}>
                (封面:{config.maxCoverImages || 3} / 版本:{config.maxVersions || 10})
              </span>
            </Space>
          ),
          icon: ({ expanded }) => 
            expanded ? <FolderOpenOutlined /> : <FolderOutlined />,
          isBuiltIn,
          data: item
        };

        // 递归处理子节点
        if (item.children && Array.isArray(item.children) && item.children.length > 0) {
          node.children = buildTreeNodes(item.children);
        }

        return node;
      });
    };

    return buildTreeNodes(categories);
  }, [categories]);

  /**
   * 获取右键菜单项
   */
  const getContextMenuItems = (node) => {
    const isBuiltIn = node.isBuiltIn;
    
    const items = [
      {
        key: 'add',
        label: '添加子分类',
        icon: <PlusOutlined />,
        onClick: () => handleAddChild(node)
      }
    ];

    // 内置分类不允许编辑和删除
    if (!isBuiltIn) {
      items.push(
        {
          key: 'edit',
          label: '编辑',
          icon: <EditOutlined />,
          onClick: () => handleEdit(node)
        },
        {
          type: 'divider'
        },
        {
          key: 'delete',
          label: '删除',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDelete(node)
        }
      );
    }

    return items;
  };

  /**
   * 处理编辑操作
   */
  const handleEdit = (node) => {
    onEdit(node.data);
  };

  /**
   * 处理删除操作
   */
  const handleDelete = (node) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除分类"${node.data.name}"吗？删除后该分类下的所有子分类也将被删除。`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        onDelete(node.data.id);
      }
    });
  };

  /**
   * 处理添加子分类操作
   */
  const handleAddChild = (node) => {
    onAddChild(node.data);
  };

  /**
   * 渲染树节点的右键菜单
   */
  const renderTreeNode = (node) => {
    return (
      <Dropdown
        menu={{ items: getContextMenuItems(node) }}
        trigger={['contextMenu']}
      >
        <div style={{ 
          userSelect: 'none', 
          display: 'inline-flex', 
          alignItems: 'center',
          width: '100%'
        }}>
          {node.title}
        </div>
      </Dropdown>
    );
  };

  /**
   * 自定义树节点标题渲染
   */
  const titleRender = (node) => {
    return renderTreeNode(node);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        暂无分类数据
      </div>
    );
  }

  return (
    <Tree
      showIcon
      showLine
      treeData={treeData}
      expandedKeys={expandedKeys}
      selectedKeys={selectedKeys}
      onExpand={onExpand}
      onSelect={onSelect}
      titleRender={titleRender}
      style={{ padding: '16px' }}
    />
  );
};

CategoryTree.propTypes = {
  categories: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  expandedKeys: PropTypes.array.isRequired,
  selectedKeys: PropTypes.array.isRequired,
  onExpand: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddChild: PropTypes.func.isRequired
};

export default CategoryTree;

import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CategoryService from '../../../services/CategoryService';
import CategoryFormModal from './CategoryFormModal';

/**
 * 分类 ProTable 组件
 * 使用 ProTable 实现分类列表管理
 */
const CategoryProTable = () => {
  const actionRef = useRef();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentCategory, setCurrentCategory] = useState(null);

  // 处理新建
  const handleCreate = () => {
    setModalMode('create');
    setCurrentCategory(null);
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record) => {
    // 内置分类不允许编辑
    if (record.isBuiltIn) {
      message.warning('内置分类不支持编辑');
      return;
    }
    setModalMode('edit');
    setCurrentCategory(record);
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (record) => {
    try {
      const response = await CategoryService.delete(record.id);
      if (response.success) {
        message.success('分类删除成功');
        actionRef.current?.reload();
      } else {
        message.error(response.msg || '分类删除失败');
      }
    } catch (error) {
      console.error('删除分类失败:', error);
      message.error('分类删除失败');
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (values) => {
    try {
      let response;
      if (modalMode === 'create') {
        response = await CategoryService.create(values);
      } else {
        response = await CategoryService.update(currentCategory.id, values);
      }

      if (response.success) {
        message.success(modalMode === 'create' ? '分类创建成功' : '分类更新成功');
        setModalVisible(false);
        actionRef.current?.reload();
        return true;
      } else {
        message.error(response.msg || '操作失败');
        return false;
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
      return false;
    }
  };

  // 列配置
  const columns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      copyable: true,
    },
    {
      title: '分类代码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      ellipsis: true,
      copyable: true,
    },
    {
      title: '父分类',
      dataIndex: ['parent', 'name'],
      key: 'parentId',
      width: 150,
      search: false,
      render: (_, record) => record.parent?.name || '-',
    },
    {
      title: '类型',
      dataIndex: 'isBuiltIn',
      key: 'isBuiltIn',
      width: 100,
      valueType: 'select',
      valueEnum: {
        true: { text: '内置', status: 'Processing' },
        false: { text: '自定义', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.isBuiltIn ? 'blue' : 'default'}>
          {record.isBuiltIn ? '内置' : '自定义'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      search: false,
      hideInTable: true,
    },
    {
      title: '排序权重',
      dataIndex: 'sortWeight',
      key: 'sortWeight',
      width: 100,
      sorter: true,
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 180,
      valueType: 'dateTime',
      sorter: true,
      search: false,
      render: (_, record) => dayjs(record.createDate).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '更新时间',
      dataIndex: 'updateDate',
      key: 'updateDate',
      width: 180,
      valueType: 'dateTime',
      sorter: true,
      search: false,
      render: (_, record) => dayjs(record.updateDate).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      search: false,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.isBuiltIn}
            style={{ padding: '0 8px' }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个分类吗？"
            description={record.isBuiltIn ? '内置分类不能删除' : '删除后不可恢复'}
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
            disabled={record.isBuiltIn}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.isBuiltIn}
              style={{ padding: '0 8px' }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 请求数据
  const request = async (params, sort) => {
    try {
      const { current, pageSize, name, code, isBuiltIn } = params;

      const queryParams = {
        page: current,
        limit: pageSize,
        name,
        tree: false, // 使用列表模式
      };

      // 添加分类代码搜索
      if (code) {
        queryParams.code = code;
      }

      // 添加类型筛选
      if (isBuiltIn !== undefined) {
        queryParams.isBuiltIn = isBuiltIn === 'true';
      }

      // 处理排序
      if (sort && Object.keys(sort).length > 0) {
        const sortField = Object.keys(sort)[0];
        const sortOrder = sort[sortField] === 'ascend' ? 'ASC' : 'DESC';
        queryParams.sortBy = sortField;
        queryParams.sortOrder = sortOrder;
      }

      const response = await CategoryService.list(queryParams);

      if (response.success) {
        return {
          data: response.data.categories || [],
          success: true,
          total: response.data.total || 0,
        };
      }

      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error) {
      console.error('获取分类列表失败:', error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <>
      <ProTable
        columns={columns}
        actionRef={actionRef}
        request={request}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          span: 6,
        }}
        form={{
          syncToUrl: false,
          size: 'middle',
        }}
        dateFormatter="string"
        headerTitle="分类列表"
        toolBarRender={() => [
          <div key="actions" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建分类
            </Button>
          </div>,
        ]}
        scroll={{ x: 1200 }}
        options={{
          reload: true,
          density: true,
          setting: true,
        }}
      />

      <CategoryFormModal
        visible={modalVisible}
        mode={modalMode}
        category={currentCategory}
        onSubmit={handleFormSubmit}
        onCancel={() => setModalVisible(false)}
      />
    </>
  );
};

export default CategoryProTable;

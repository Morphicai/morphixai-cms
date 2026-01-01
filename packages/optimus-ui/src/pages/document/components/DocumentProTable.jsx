import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DocumentService from '../../../services/DocumentService';
import DocumentFormModal from './DocumentFormModal';

/**
 * 文案管理 ProTable 组件
 * 使用 ProTable 实现高级表格功能
 */
const DocumentProTable = () => {
  const actionRef = useRef();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingData, setEditingData] = useState(null);

  // 处理新建
  const handleCreate = () => {
    setModalMode('create');
    setEditingData(null);
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record) => {
    setModalMode('edit');
    setEditingData(record);
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (record) => {
    try {
      const response = await DocumentService.delete(record.id);
      if (response.success) {
        message.success('删除成功');
        actionRef.current?.reload();
      } else {
        message.error(response.msg || '删除失败');
      }
    } catch (error) {
      console.error('删除文档失败:', error);
      message.error('删除失败');
    }
  };

  // 处理表单提交
  const handleModalOk = async (values) => {
    try {
      let response;
      if (modalMode === 'create') {
        response = await DocumentService.create(values);
      } else {
        response = await DocumentService.updateById(editingData.id, values);
      }

      if (response.success) {
        message.success(modalMode === 'create' ? '创建成功' : '更新成功');
        setModalVisible(false);
        actionRef.current?.reload();
      } else {
        message.error(response.msg || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }
  };

  // 列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      search: false,
    },
    {
      title: '文档标识',
      dataIndex: 'docKey',
      key: 'docKey',
      width: 150,
      ellipsis: true,
      copyable: true,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: {
        string: { text: '字符串' },
        text: { text: '文本' },
        html: { text: 'HTML' },
        json: { text: 'JSON' },
        number: { text: '数字' },
        color: { text: '颜色' },
      },
      render: (_, record) => (
        <Tag color="blue">{record.type || '字符串'}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      search: false,
      width: 300,
    },
    {
      title: '是否公开',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 100,
      valueType: 'select',
      valueEnum: {
        true: { text: '公开', status: 'Success' },
        false: { text: '私有', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.isPublic ? 'green' : 'default'}>
          {record.isPublic ? '公开' : '私有'}
        </Tag>
      ),
    },
    {
      title: '菜单显示',
      dataIndex: 'showOnMenu',
      key: 'showOnMenu',
      width: 100,
      valueType: 'select',
      valueEnum: {
        true: { text: '显示', status: 'Success' },
        false: { text: '隐藏', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.showOnMenu ? 'success' : 'default'}>
          {record.showOnMenu ? '显示' : '隐藏'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '更新时间',
      dataIndex: 'updateDate',
      key: 'updateDate',
      width: 180,
      valueType: 'dateTime',
      search: false,
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
            style={{ padding: '0 8px' }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条文档吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
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
  const request = async (params) => {
    try {
      const { current, pageSize, docKey, description, source, type, isPublic, showOnMenu } = params;

      const queryParams = {
        page: current - 1, // 后端页码从 0 开始，前端从 1 开始，需要减 1
        size: pageSize,
        docKey,
        description,
        source,
        type,
        isPublic,
        showOnMenu,
      };

      const response = await DocumentService.list(queryParams);

      if (response.success) {
        return {
          data: response.data || [],
          success: true,
          total: response.total || 0,
        };
      }

      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error) {
      console.error('获取文档列表失败:', error);
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
        headerTitle="文案列表"
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新增文案
          </Button>,
        ]}
        scroll={{ x: 1200 }}
        options={{
          reload: true,
          density: true,
          setting: true,
        }}
      />

      <DocumentFormModal
        open={modalVisible}
        mode={modalMode}
        initialData={editingData}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
      />
    </>
  );
};

export default DocumentProTable;

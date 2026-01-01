import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Tag, message, Modal, Form, Input, Select, Switch, Space, Tooltip, Statistic, Card, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, CopyOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ShortLinkService from '../../../../services/ShortLinkService';
import { useMount } from '../../../../shared/hooks';

const { TextArea } = Input;

/**
 * ShortToken管理 ProTable 组件（系统管理）
 * 管理所有来源的短链
 */
const ShortTokenProTable = () => {
  const actionRef = useRef();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    adminCount: 0,
    systemCount: 0,
    apiCount: 0,
    totalUseCount: 0,
  });

  // 状态枚举
  const statusEnum = {
    active: { text: '有效', status: 'Success' },
    inactive: { text: '无效', status: 'Error' },
  };

  // 来源枚举
  const sourceEnum = {
    admin: { text: '后台管理', status: 'Processing' },
    system: { text: '系统创建', status: 'Default' },
    api: { text: 'API接口', status: 'Warning' },
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      // 这里可以添加统计接口，暂时从列表数据计算
      const response = await ShortLinkService.list({ page: 1, pageSize: 1 });
      if (response.success) {
        setStats(prev => ({ ...prev, total: response.data?.total || 0 }));
      }
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  useMount(() => {
    loadStats();
  });

  // 打开编辑弹窗
  const handleOpenModal = (record) => {
    setEditingRecord(record);
    
    form.setFieldsValue({
      status: record.status,
      disabled: record.disabled,
      extra: record.extra ? JSON.stringify(record.extra, null, 2) : '',
      remark: record.remark,
    });
    setModalVisible(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // 查看详情
  const handleViewDetail = (record) => {
    setViewingRecord(record);
    setDetailModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 解析extra
      let extra = values.extra;
      if (extra) {
        try {
          extra = JSON.parse(values.extra);
        } catch {
          message.error('扩展字段格式错误，请输入有效的JSON');
          return;
        }
      }

      const data = {
        status: values.status,
        disabled: values.disabled,
        extra,
        remark: values.remark,
      };
      
      const response = await ShortLinkService.update(editingRecord.id, data);
      if (response.success) {
        message.success('更新成功');
        handleCloseModal();
        actionRef.current?.reload();
        loadStats();
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  // 删除短链
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: (
        <div>
          <p>确定要删除短链 <strong>{record.token}</strong> 吗？</p>
          <p style={{ color: '#ff4d4f' }}>来源：{sourceEnum[record.source]?.text}</p>
          <p style={{ color: '#ff4d4f' }}>使用次数：{record.useCount}</p>
        </div>
      ),
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await ShortLinkService.delete(record.id);
          if (response.success) {
            message.success('删除成功');
            actionRef.current?.reload();
            loadStats();
          } else {
            message.error(response.message || '删除失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败');
        }
      },
    });
  };

  // 复制token
  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token).then(() => {
      message.success('Token已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 复制解析URL
  const handleCopyUrl = (token) => {
    const url = `${window.location.origin}/public/short-link/resolve/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      message.success('解析URL已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 列配置
  const columns = [
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      width: 120,
      fixed: 'left',
      render: (text) => (
        <Space>
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{text}</span>
          <Tooltip title="复制Token">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyToken(text)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      valueType: 'select',
      valueEnum: sourceEnum,
      render: (_, record) => (
        <Tag color={
          record.source === 'admin' ? 'blue' : 
          record.source === 'system' ? 'default' : 'orange'
        }>
          {sourceEnum[record.source]?.text}
        </Tag>
      ),
    },
    {
      title: '目标配置',
      dataIndex: 'target',
      key: 'target',
      ellipsis: true,
      search: false,
      render: (_, record) => {
        const target = record.target;
        const displayText = typeof target === 'object' && target !== null
          ? JSON.stringify(target) 
          : String(target || '');
        return (
          <Tooltip title={displayText}>
            <span style={{ maxWidth: 250, display: 'inline-block' }}>
              {displayText.length > 50 ? displayText.substring(0, 50) + '...' : displayText}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'green' : 'red'}>
          {record.status === 'active' ? '有效' : '无效'}
        </Tag>
      ),
    },
    {
      title: '禁用',
      dataIndex: 'disabled',
      key: 'disabled',
      width: 70,
      valueType: 'select',
      valueEnum: {
        true: { text: '是', status: 'Error' },
        false: { text: '否', status: 'Success' },
      },
      render: (_, record) => (
        <Tag color={record.disabled ? 'red' : 'green'}>
          {record.disabled ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'useCount',
      key: 'useCount',
      width: 100,
      search: false,
      sorter: true,
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      width: 160,
      hideInSearch: true,
      render: (_, record) => record.lastUsedAt ? dayjs(record.lastUsedAt).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      hideInSearch: true,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 请求数据
  const request = async (params) => {
    try {
      const { current, pageSize, token, source, status, disabled } = params;

      const queryParams = {
        page: current,
        pageSize,
        token,
        source,
        status,
        disabled,
      };

      const response = await ShortLinkService.list(queryParams);

      if (response.success) {
        return {
          data: response.data?.items || [],
          success: true,
          total: response.data?.total || 0,
        };
      }

      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error) {
      console.error('获取短链列表失败:', error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <>
      {/* 统计信息卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总Token数"
              value={stats.total}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="后台管理"
              value={stats.adminCount}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="系统创建"
              value={stats.systemCount}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="API接口"
              value={stats.apiCount}
              suffix="个"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <ProTable
        columns={columns}
        actionRef={actionRef}
        request={request}
        rowKey="id"
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
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
        headerTitle="ShortToken列表"
        toolBarRender={() => [
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => {
              actionRef.current?.reload();
              loadStats();
            }}
          >
            刷新
          </Button>,
        ]}
        scroll={{ x: 1600 }}
        options={{
          reload: true,
          density: true,
          setting: true,
        }}
      />

      {/* 编辑弹窗 */}
      <Modal
        title="编辑ShortToken"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="active">有效</Select.Option>
              <Select.Option value="inactive">无效</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="禁用"
            name="disabled"
            valuePropName="checked"
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Form.Item
            label="扩展字段"
            name="extra"
            extra="JSON格式"
          >
            <TextArea
              placeholder='{"key":"value"}'
              rows={3}
            />
          </Form.Item>

          <Form.Item
            label="备注"
            name="remark"
          >
            <TextArea
              placeholder="备注说明"
              rows={2}
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="ShortToken详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="copy-token" onClick={() => handleCopyToken(viewingRecord?.token)}>
            复制Token
          </Button>,
          <Button key="copy-url" onClick={() => handleCopyUrl(viewingRecord?.token)}>
            复制解析URL
          </Button>,
          <Button key="close" type="primary" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {viewingRecord && (
          <div>
            <p><strong>Token:</strong> <code>{viewingRecord.token}</code></p>
            <p><strong>来源:</strong> <Tag color={
              viewingRecord.source === 'admin' ? 'blue' : 
              viewingRecord.source === 'system' ? 'default' : 'orange'
            }>{sourceEnum[viewingRecord.source]?.text}</Tag></p>
            <p><strong>状态:</strong> <Tag color={viewingRecord.status === 'active' ? 'green' : 'red'}>
              {viewingRecord.status === 'active' ? '有效' : '无效'}
            </Tag></p>
            <p><strong>禁用:</strong> <Tag color={viewingRecord.disabled ? 'red' : 'green'}>
              {viewingRecord.disabled ? '是' : '否'}
            </Tag></p>
            <p><strong>使用次数:</strong> {viewingRecord.useCount}</p>
            <p><strong>最后使用:</strong> {viewingRecord.lastUsedAt ? dayjs(viewingRecord.lastUsedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</p>
            <p><strong>目标配置:</strong></p>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
              {typeof viewingRecord.target === 'object' 
                ? JSON.stringify(viewingRecord.target, null, 2)
                : viewingRecord.target}
            </pre>
            {viewingRecord.extra && (
              <>
                <p><strong>扩展字段:</strong></p>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  {JSON.stringify(viewingRecord.extra, null, 2)}
                </pre>
              </>
            )}
            <p><strong>备注:</strong> {viewingRecord.remark || '-'}</p>
            <p><strong>创建时间:</strong> {dayjs(viewingRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            <p><strong>更新时间:</strong> {dayjs(viewingRecord.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            <p><strong>解析URL:</strong></p>
            <code style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, display: 'block' }}>
              {window.location.origin}/public/short-link/resolve/{viewingRecord.token}
            </code>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ShortTokenProTable;

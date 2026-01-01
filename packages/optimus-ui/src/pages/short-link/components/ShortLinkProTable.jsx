import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Tag, message, Modal, Form, Input, Select, Space, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ShortLinkService from '../../../services/ShortLinkService';

const { TextArea } = Input;

/**
 * 短链管理 ProTable 组件
 */
const ShortLinkProTable = () => {
  const actionRef = useRef();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // 状态枚举
  const statusEnum = {
    active: { text: '有效', status: 'Success' },
    inactive: { text: '无效', status: 'Error' },
  };

  // 打开创建/编辑弹窗
  const handleOpenModal = (record = null) => {
    setEditingRecord(record);
    if (record) {
      form.setFieldsValue({
        token: record.token,
        target: record.target,
        status: record.status,
        remark: record.remark,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRecord) {
        // 更新
        const response = await ShortLinkService.update(editingRecord.id, values);
        if (response.success) {
          message.success('更新成功');
          handleCloseModal();
          actionRef.current?.reload();
        } else {
          message.error(response.message || '更新失败');
        }
      } else {
        // 创建
        const response = await ShortLinkService.create(values);
        if (response.success) {
          message.success('创建成功');
          handleCloseModal();
          actionRef.current?.reload();
        } else {
          message.error(response.message || '创建失败');
        }
      }
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  // 删除短链
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除短链 "${record.token}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await ShortLinkService.delete(record.id);
          if (response.success) {
            message.success('删除成功');
            actionRef.current?.reload();
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

  // 复制目标内容
  const handleCopyTarget = (target) => {
    navigator.clipboard.writeText(target).then(() => {
      message.success('目标内容已复制到剪贴板');
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
      title: '目标内容',
      dataIndex: 'target',
      key: 'target',
      ellipsis: true,
      render: (text) => (
        <Space>
          <Tooltip title={text}>
            <span style={{ maxWidth: 400, display: 'inline-block' }}>{text}</span>
          </Tooltip>
          <Tooltip title="复制目标内容">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyTarget(text)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'green' : 'red'}>
          {record.status === 'active' ? '有效' : '无效'}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      ellipsis: true,
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space>
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
      const { current, pageSize, token, target, status } = params;

      const queryParams = {
        page: current,
        pageSize,
        token,
        target,
        status,
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
        headerTitle="短链列表"
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            创建短链
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            刷新
          </Button>,
        ]}
        scroll={{ x: 1400 }}
        options={{
          reload: true,
          density: true,
          setting: true,
        }}
      />

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑短链' : '创建短链'}
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
            label="Token"
            name="token"
            rules={[
              { len: 6, message: 'Token必须为6位' },
              { pattern: /^[a-zA-Z0-9]+$/, message: 'Token只能包含字母和数字' },
            ]}
            extra={editingRecord ? 'Token不可修改' : '留空则自动生成6位随机Token'}
          >
            <Input
              placeholder="6位Token（留空自动生成）"
              maxLength={6}
              disabled={!!editingRecord}
            />
          </Form.Item>

          <Form.Item
            label="目标内容"
            name="target"
            rules={[{ required: true, message: '请输入目标内容' }]}
            extra="可以是URL、参数字符串或相对路径"
          >
            <TextArea
              placeholder="例如：https://example.com?param=value 或 channel=A&source=B"
              rows={4}
            />
          </Form.Item>

          {editingRecord && (
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
          )}

          <Form.Item
            label="备注"
            name="remark"
          >
            <TextArea
              placeholder="例如：推广渠道A的邀请链接"
              rows={2}
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ShortLinkProTable;

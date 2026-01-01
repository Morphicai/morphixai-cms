import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Tag, message, Modal, Form, Input, Select, Switch, Space, Tooltip, Collapse, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, ReloadOutlined, QrcodeOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import dayjs from 'dayjs';
import ShortLinkService from '../../../../services/ShortLinkService';

const { TextArea } = Input;
const { Panel } = Collapse;

// 获取客户端URL
const CLIENT_URL = process.env.REACT_APP_CLIENT_URL || 'https://example.com/';

/**
 * 短链管理 ProTable 组件（内容管理）
 * 只管理 source='admin' 的短链
 */
const ShortLinkProTable = () => {
  const actionRef = useRef();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [qrSize, setQrSize] = useState(256);
  const [form] = Form.useForm();

  // 生成短链URL
  const getShortUrl = (token) => {
    const baseUrl = CLIENT_URL.endsWith('/') ? CLIENT_URL : CLIENT_URL + '/';
    return `${baseUrl}s/${token}`;
  };

  // 状态枚举
  const statusEnum = {
    active: { text: '有效', status: 'Success' },
    inactive: { text: '无效', status: 'Error' },
  };

  // 打开创建/编辑弹窗
  const handleOpenModal = (record = null) => {
    setEditingRecord(record);
    if (record) {
      // 编辑模式 - 解析target对象
      const target = record.target || {};
      form.setFieldsValue({
        defaultUrl: target.default || '',
        androidUrl: target.android || '',
        iosUrl: target.ios || '',
        status: record.status,
        disabled: record.disabled,
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
      
      // 构建target对象（default作为默认值）
      const target = {
        default: values.defaultUrl,
      };
      
      // 只有填写了才添加
      if (values.androidUrl) {
        target.android = values.androidUrl;
      }
      if (values.iosUrl) {
        target.ios = values.iosUrl;
      }

      const data = {
        target,
        remark: values.remark,
        source: 'admin', // 固定为admin来源
      };

      // 编辑模式才传这些字段
      if (editingRecord) {
        data.status = values.status;
        data.disabled = values.disabled;
      }
      
      if (editingRecord) {
        // 更新
        const response = await ShortLinkService.update(editingRecord.id, data);
        if (response.success) {
          message.success('更新成功');
          handleCloseModal();
          actionRef.current?.reload();
        } else {
          message.error(response.message || '更新失败');
        }
      } else {
        // 创建
        const response = await ShortLinkService.create(data);
        if (response.success) {
          message.success(`创建成功！Token: ${response.data.token}`);
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

  // 复制短链URL
  const handleCopyUrl = (token) => {
    const url = getShortUrl(token);
    navigator.clipboard.writeText(url).then(() => {
      message.success('短链URL已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 打开详情弹窗
  const handleOpenDetail = (record) => {
    setDetailRecord(record);
    setDetailVisible(true);
    setQrSize(256);
  };

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setDetailVisible(false);
    setDetailRecord(null);
  };

  // 下载二维码
  const handleDownloadQrCode = () => {
    const svg = document.getElementById('short-link-qrcode');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = qrSize;
    canvas.height = qrSize;

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qrcode-${detailRecord.token}.png`;
        link.click();
        URL.revokeObjectURL(url);
        message.success('二维码已下载');
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // 列配置
  const columns = [
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      width: 150,
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
          <Tooltip title="复制短链">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: '#1890ff' }} />}
              onClick={() => handleCopyUrl(text)}
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
      title: '禁用',
      dataIndex: 'disabled',
      key: 'disabled',
      width: 80,
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
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      width: 180,
      hideInSearch: true,
      render: (_, record) => record.lastUsedAt ? dayjs(record.lastUsedAt).format('YYYY-MM-DD HH:mm:ss') : '-',
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
      hideInSearch: true,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<QrcodeOutlined />}
            onClick={() => handleOpenDetail(record)}
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
      const { current, pageSize, token, status, disabled } = params;

      const queryParams = {
        page: current,
        pageSize,
        token,
        status,
        disabled,
        source: 'admin', // 只查询admin来源的短链
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
        scroll={{ x: 1600 }}
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
          {editingRecord && (
            <Form.Item label="短链URL">
              <Input
                value={getShortUrl(editingRecord.token)}
                readOnly
                addonAfter={
                  <CopyOutlined
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleCopyUrl(editingRecord.token)}
                  />
                }
              />
            </Form.Item>
          )}

          <Form.Item
            label="默认链接"
            name="defaultUrl"
            rules={[
              { required: true, message: '请输入默认链接' },
              { type: 'url', message: '请输入有效的URL' },
            ]}
            extra="当其他平台未配置时使用此链接"
          >
            <Input
              placeholder="https://example.com/download"
              prefix="🔗"
            />
          </Form.Item>

          <Collapse ghost>
            <Panel header="其他平台链接（选填）" key="1">
              <Form.Item
                label="Android链接"
                name="androidUrl"
                rules={[
                  { type: 'url', message: '请输入有效的URL' },
                ]}
                extra="选填，不填则使用默认链接"
              >
                <Input
                  placeholder="https://example.com/android"
                  prefix="🤖"
                />
              </Form.Item>

              <Form.Item
                label="iOS链接"
                name="iosUrl"
                rules={[
                  { type: 'url', message: '请输入有效的URL' },
                ]}
                extra="选填，不填则使用默认链接"
              >
                <Input
                  placeholder="https://example.com/ios"
                  prefix="🍎"
                />
              </Form.Item>
            </Panel>
          </Collapse>

          {editingRecord && (
            <>
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
            </>
          )}

          <Form.Item
            label="备注"
            name="remark"
          >
            <TextArea
              placeholder="例如：App下载页面"
              rows={2}
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="短链详情"
        open={detailVisible}
        onCancel={handleCloseDetail}
        footer={[
          <Button key="download" type="primary" onClick={handleDownloadQrCode}>
            下载二维码
          </Button>,
          <Button key="close" onClick={handleCloseDetail}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {detailRecord && (
          <div style={{ padding: '20px 0' }}>
            <Form layout="vertical">
              <Form.Item label="Token">
                <Input
                  value={detailRecord.token}
                  readOnly
                  addonAfter={
                    <CopyOutlined
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCopyToken(detailRecord.token)}
                    />
                  }
                />
              </Form.Item>

              <Form.Item label="短链URL">
                <Input
                  value={getShortUrl(detailRecord.token)}
                  readOnly
                  addonAfter={
                    <CopyOutlined
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCopyUrl(detailRecord.token)}
                    />
                  }
                />
              </Form.Item>

              <Form.Item label="二维码">
                <div style={{ textAlign: 'center', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
                  <QRCodeSVG
                    id="short-link-qrcode"
                    value={getShortUrl(detailRecord.token)}
                    size={qrSize}
                    level="H"
                    includeMargin
                  />
                  <div style={{ marginTop: '16px' }}>
                    <Space>
                      <span>尺寸：</span>
                      <InputNumber
                        min={128}
                        max={512}
                        step={64}
                        value={qrSize}
                        onChange={setQrSize}
                        addonAfter="px"
                      />
                    </Space>
                  </div>
                </div>
              </Form.Item>

              <Collapse ghost>
                <Panel header="目标配置（高级）" key="1">
                  <TextArea
                    value={typeof detailRecord.target === 'object' 
                      ? JSON.stringify(detailRecord.target, null, 2) 
                      : detailRecord.target}
                    readOnly
                    rows={6}
                    style={{ fontFamily: 'monospace' }}
                  />
                </Panel>
              </Collapse>

              <Form.Item label="状态">
                <Tag color={detailRecord.status === 'active' ? 'green' : 'red'}>
                  {detailRecord.status === 'active' ? '有效' : '无效'}
                </Tag>
                {detailRecord.disabled && (
                  <Tag color="red" style={{ marginLeft: 8 }}>已禁用</Tag>
                )}
              </Form.Item>

              <Form.Item label="使用统计">
                <div>
                  <div>使用次数：{detailRecord.useCount || 0}</div>
                  <div>
                    最后使用：{detailRecord.lastUsedAt 
                      ? dayjs(detailRecord.lastUsedAt).format('YYYY-MM-DD HH:mm:ss') 
                      : '未使用'}
                  </div>
                </div>
              </Form.Item>

              {detailRecord.remark && (
                <Form.Item label="备注">
                  <div>{detailRecord.remark}</div>
                </Form.Item>
              )}
            </Form>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ShortLinkProTable;

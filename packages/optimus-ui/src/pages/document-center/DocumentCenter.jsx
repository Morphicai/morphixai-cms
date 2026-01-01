import React, { useState, useRef } from 'react';
import { ProTable } from '@ant-design/pro-table';
import {
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Upload,
  Image,
  Drawer,
  Tabs,
  Card,
  Typography,
  Tooltip,
  theme
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileTextOutlined,
  CopyOutlined
} from '@ant-design/icons';
import documentService from '../../services/DocumentService';
import { TYPES } from './configs/documentTypes';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const DocumentCenter = () => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewType, setPreviewType] = useState('string');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const actionRef = useRef();

  // 文档类型选项
  const typeOptions = TYPES.map(type => ({
    label: type.label,
    value: type.value,
  }));

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '文档Key',
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
      valueType: 'select',
      valueEnum: {
        all: { text: '全部' },
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: typeOptions.reduce((acc, item) => {
        acc[item.value] = { text: item.label };
        return acc;
      }, {}),
      render: (_, record) => {
        const typeItem = TYPES.find(t => t.value === record.type);
        return typeItem ? (
          <Tag color="blue">{typeItem.label}</Tag>
        ) : record.type;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '是否公开',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 100,
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.isPublic ? 'green' : 'default'}>
          {record.isPublic ? '公开' : '私有'}
        </Tag>
      ),
    },
    {
      title: '菜单展示',
      dataIndex: 'showOnMenu',
      key: 'showOnMenu',
      width: 100,
      hideInSearch: true,
      valueType: 'switch',
      render: (_, record) => (
        <Switch
          checked={record.showOnMenu}
          disabled
          size="small"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          <Tooltip title="详细信息">
            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
          </Tooltip>
          <Tooltip title="预览内容">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            >
              预览
            </Button>
          </Tooltip>
          <Tooltip title="编辑文档">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="下载内容">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            >
              下载
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定要删除这个文档吗？"
            onConfirm={() => handleDelete(record)}
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
        </Space>
      ),
    },
  ];

  // 获取文档列表
  const fetchDocuments = async (params, sort, filter) => {
    console.log('🚀 fetchDocuments - ProTable params:', params);

    try {
      const queryParams = {
        page: params.current - 1, // 后端分页从0开始，前端从1开始，需要减1
        size: params.pageSize,
        ...params,
      };

      // 处理排序
      if (sort && Object.keys(sort).length > 0) {
        const sortField = Object.keys(sort)[0];
        const sortOrder = sort[sortField] === 'ascend' ? 'ASC' : 'DESC';
        queryParams.sortField = sortField;
        queryParams.sortOrder = sortOrder;
      }

      console.log('📤 查询参数 (page已修正):', queryParams);

      const response = await documentService.list(queryParams);

      // 确保数据是数组格式
      const data = Array.isArray(response.data) ? response.data : [];

      const result = {
        data,
        success: response.success !== false,
        total: response.total || 0,
      };

      console.log('✅ 返回结果 - 数据条数:', data.length, '总数:', result.total);
      return result;
    } catch (error) {
      console.error('❌ fetchDocuments 发生错误:', error);
      console.error('❌ 错误消息:', error.message);
      console.error('❌ 错误堆栈:', error.stack);
      message.error('获取文档列表失败');
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  // 处理新建
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      accountIdPerms: record.accountIdPerms || [],
      roleIdPerms: record.roleIdPerms || [],
    });
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (record) => {
    try {
      await documentService.delete(record.id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 处理预览
  const handlePreview = (record) => {
    setPreviewContent(record.content);
    setPreviewType(record.type);
    setPreviewVisible(true);
  };

  // 处理查看详情
  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setDrawerVisible(true);
  };

  // 处理下载
  const handleDownload = (record) => {
    try {
      const content = record.content;
      const filename = `${record.docKey}_${record.type}.txt`;

      // 根据类型处理内容
      let downloadContent = content;
      if (record.type === 'json') {
        try {
          downloadContent = JSON.stringify(JSON.parse(content), null, 2);
        } catch {
          downloadContent = content;
        }
      }

      // 创建下载链接
      const blob = new Blob([downloadContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('下载成功');
    } catch (error) {
      message.error('下载失败');
    }
  };



  // 复制到剪贴板
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('复制成功');
    } catch (error) {
      message.error('复制失败');
    }
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingRecord) {
        // 更新文档
        await documentService.updateById(editingRecord.id, values);
        message.success('更新成功');
      } else {
        // 创建文档
        await documentService.create(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error(editingRecord ? '更新失败' : '创建失败');
    }
  };

  // 渲染内容预览
  const renderPreviewContent = (content, type) => {
    switch (type) {
      case 'json':
        try {
          const parsed = JSON.parse(content);
          return (
            <div>
              <div style={{ marginBottom: 8 }}>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(JSON.stringify(parsed, null, 2))}
                >
                  复制JSON
                </Button>
              </div>
              <pre style={{
                backgroundColor: token.colorBgLayout,
                padding: '12px',
                borderRadius: '4px',
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </div>
          );
        } catch {
          return <pre style={{ backgroundColor: token.colorBgLayout, padding: '12px' }}>{content}</pre>;
        }
      case 'code':
        return (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(content)}
              >
                复制代码
              </Button>
            </div>
            <pre style={{
              backgroundColor: token.colorBgLayout,
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              lineHeight: '1.4'
            }}>
              {content}
            </pre>
          </div>
        );
      case 'richText':
        return (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(content)}
              >
                复制HTML
              </Button>
            </div>
            <Card>
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </Card>
          </div>
        );
      case 'image':
        return (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={content}
              alt="预览"
              style={{ maxWidth: '100%', maxHeight: '400px' }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
            />
            <div style={{ marginTop: 8 }}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(content)}
              >
                复制链接
              </Button>
            </div>
          </div>
        );
      case 'color':
        return (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '100px',
                height: '100px',
                backgroundColor: content,
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                margin: '0 auto 12px'
              }}
            />
            <Text strong>{content}</Text>
            <div style={{ marginTop: 8 }}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(content)}
              >
                复制颜色值
              </Button>
            </div>
          </div>
        );
      case 'number':
        return (
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>{content}</Text>
            <div style={{ marginTop: 8 }}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(content)}
              >
                复制数值
              </Button>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(content)}
              >
                复制文本
              </Button>
            </div>
            <Paragraph copyable={{ text: content }}>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {content}
              </div>
            </Paragraph>
          </div>
        );
    }
  };

  return (
    <div>
      <ProTable
        columns={columns}
        request={fetchDocuments}
        rowKey="id"
        actionRef={actionRef}
        search={{
          labelWidth: 'auto',
          collapsed: false,
          collapseRender: (collapsed, showCollapseIcon) => {
            if (collapsed) {
              return (
                <Button type="link" style={{ fontSize: 14 }} onClick={showCollapseIcon}>
                  展开 <span style={{ marginLeft: 4 }}>↓</span>
                </Button>
              );
            }
            return (
              <Button type="link" style={{ fontSize: 14 }} onClick={showCollapseIcon}>
                收起 <span style={{ marginLeft: 4 }}>↑</span>
              </Button>
            );
          },
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新建文档
          </Button>,
        ]}
        options={{
          reload: true,
          density: true,
          fullScreen: true,
          setting: true,
        }}
      />

      {/* 编辑/新建模态框 */}
      <Modal
        title={editingRecord ? '编辑文档' : '新建文档'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            showOnMenu: false,
            isPublic: false,
            source: 'all',
            type: 'string',
          }}
        >
          <Form.Item
            name="docKey"
            label="文档Key"
            rules={[
              { required: true, message: '请输入文档Key' },
              { min: 2, max: 40, message: '文档Key长度为2-40个字符' },
              {
                validator: async (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  
                  // 编辑时不需要检查（或者传入当前记录的ID以排除自己）
                  if (editingRecord) {
                    return Promise.resolve();
                  }
                  
                  // 调用 API 检查 docKey 是否已存在
                  try {
                    const exists = await documentService.checkDocKeyExists(value);
                    if (exists) {
                      return Promise.reject(new Error('该文档Key已存在，请使用其他标识符'));
                    }
                    return Promise.resolve();
                  } catch (error) {
                    // 如果检查失败，允许继续（避免网络问题阻止用户操作）
                    console.error('检查文档Key唯一性失败:', error);
                    return Promise.resolve();
                  }
                },
              },
            ]}
            validateTrigger="onBlur"
          >
            <Input 
              placeholder="请输入文档Key" 
              disabled={!!editingRecord}
            />
          </Form.Item>

          <Form.Item
            name="source"
            label="来源"
            rules={[
              { required: true, message: '请输入来源' },
              { min: 2, max: 40, message: '来源长度为2-40个字符' },
            ]}
          >
            <Input placeholder="请输入来源" />
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型" options={typeOptions} />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[
              { required: true, message: '请输入描述' },
              { min: 2, max: 40, message: '描述长度为2-40个字符' },
            ]}
          >
            <Input placeholder="请输入描述" />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <div>
              <TextArea
                rows={8}
                placeholder="请输入内容"
                showCount
                maxLength={50000}
              />
              <div style={{ marginTop: 8 }}>
                <Upload
                  accept=".txt,.json,.js,.css,.html,.md"
                  beforeUpload={(file) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const content = e.target.result;
                      form.setFieldsValue({ content });
                      message.success('文件内容已加载');
                    };
                    reader.readAsText(file);
                    return false; // 阻止自动上传
                  }}
                  showUploadList={false}
                >
                  <Button size="small" icon={<UploadOutlined />}>
                    从文件加载内容
                  </Button>
                </Upload>
              </div>
            </div>
          </Form.Item>

          <Form.Item
            name="showOnMenu"
            label="菜单展示"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isPublic"
            label="是否公开"
            valuePropName="checked"
            tooltip="公开后可通过公开接口访问"
          >
            <Switch 
              checkedChildren="公开" 
              unCheckedChildren="私有" 
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 内容预览模态框 */}
      <Modal
        title="内容预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => {
            if (selectedRecord) {
              handleDownload(selectedRecord);
            }
          }}>
            下载
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        <div style={{ maxHeight: '600px', overflow: 'auto' }}>
          {renderPreviewContent(previewContent, previewType)}
        </div>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="文档详情"
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedRecord && (
          <div>
            <Tabs defaultActiveKey="basic">
              <TabPane tab="基本信息" key="basic">
                <Card>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>文档ID：</Text>
                    <Text copyable>{selectedRecord.id}</Text>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>文档Key：</Text>
                    <Text copyable>{selectedRecord.docKey}</Text>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>来源：</Text>
                    <Tag color="blue">{selectedRecord.source}</Tag>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>类型：</Text>
                    <Tag color="green">
                      {TYPES.find(t => t.value === selectedRecord.type)?.label || selectedRecord.type}
                    </Tag>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>描述：</Text>
                    <Paragraph>{selectedRecord.description}</Paragraph>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>是否公开：</Text>
                    <Tag color={selectedRecord.isPublic ? 'green' : 'default'}>
                      {selectedRecord.isPublic ? '公开' : '私有'}
                    </Tag>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>菜单展示：</Text>
                    <Switch checked={selectedRecord.showOnMenu} disabled />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>创建时间：</Text>
                    <Text>{new Date(selectedRecord.createDate).toLocaleString()}</Text>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>操作人ID：</Text>
                    <Text>{selectedRecord.userId}</Text>
                  </div>
                </Card>
              </TabPane>

              <TabPane tab="内容预览" key="content">
                <Card>
                  {renderPreviewContent(selectedRecord.content, selectedRecord.type)}
                </Card>
              </TabPane>

              <TabPane tab="权限信息" key="permissions">
                <Card>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>用户权限：</Text>
                    <div style={{ marginTop: 8 }}>
                      {selectedRecord.accountIdPerms && selectedRecord.accountIdPerms.length > 0 ? (
                        selectedRecord.accountIdPerms.map(id => (
                          <Tag key={id} color="blue">用户ID: {id}</Tag>
                        ))
                      ) : (
                        <Text type="secondary">无特定用户权限限制</Text>
                      )}
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>角色权限：</Text>
                    <div style={{ marginTop: 8 }}>
                      {selectedRecord.roleIdPerms && selectedRecord.roleIdPerms.length > 0 ? (
                        selectedRecord.roleIdPerms.map(id => (
                          <Tag key={id} color="green">角色ID: {id}</Tag>
                        ))
                      ) : (
                        <Text type="secondary">无特定角色权限限制</Text>
                      )}
                    </div>
                  </div>
                </Card>
              </TabPane>
            </Tabs>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDrawerVisible(false);
                    handleEdit(selectedRecord);
                  }}
                >
                  编辑文档
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(selectedRecord)}
                >
                  下载内容
                </Button>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setDrawerVisible(false);
                    handlePreview(selectedRecord);
                  }}
                >
                  预览内容
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DocumentCenter;
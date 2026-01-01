import { useState, useRef } from 'react';
import { ProTable } from '@ant-design/pro-table';
import {
  Button,
  Space,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Tag,
  Tooltip,
  Checkbox,
  InputNumber,
  Collapse
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined
} from '@ant-design/icons';
import fileService from '../../../services/FileService';
import OssImage from '../../../shared/components/OssImage';
import { getFullFileUrl } from '../../../shared/utils/fileUtils';

/**
 * 文件管理页面
 */
const { Panel } = Collapse;

const FilePage = () => {
  const [form] = Form.useForm();
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const actionRef = useRef();

  // 文件类型映射
  const getFileTypeTag = (fileName) => {
    if (!fileName) return <Tag>未知</Tag>;

    const ext = fileName.split('.').pop()?.toLowerCase();
    const typeMap = {
      'pdf': { color: 'red', text: 'PDF' },
      'doc': { color: 'blue', text: 'Word' },
      'docx': { color: 'blue', text: 'Word' },
      'xls': { color: 'green', text: 'Excel' },
      'xlsx': { color: 'green', text: 'Excel' },
      'ppt': { color: 'orange', text: 'PPT' },
      'pptx': { color: 'orange', text: 'PPT' },
      'jpg': { color: 'purple', text: '图片' },
      'jpeg': { color: 'purple', text: '图片' },
      'png': { color: 'purple', text: '图片' },
      'gif': { color: 'purple', text: '图片' },
      'txt': { color: 'default', text: '文本' },
      'zip': { color: 'volcano', text: '压缩包' },
      'rar': { color: 'volcano', text: '压缩包' },
    };

    const type = typeMap[ext] || { color: 'default', text: '其他' };
    return <Tag color={type.color}>{type.text}</Tag>;
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '预览',
      key: 'preview',
      width: 90,
      hideInSearch: true,
      render: (_, record) => {
        const imageUrl = record.thumbnail_url || record.url;
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '60px',
            overflow: 'hidden'
          }}>
            {isImageFile(record.ossKey) ? (
              <OssImage
                src={imageUrl}
                alt={record.ossKey}
                width={60}
                height={60}
                style={{ objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                preview={{
                  src: record.url ? getFullFileUrl(record.url) : undefined,
                }}
              />
            ) : (
              <FileOutlined style={{ fontSize: '28px', opacity: 0.3 }} />
            )}
          </div>
        );
      },
    },
    {
      title: '文件名',
      dataIndex: 'ossKey',
      key: 'ossKey',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '文件类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      hideInSearch: true,
      render: (_, record) => getFileTypeTag(record.ossKey),
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      hideInSearch: true,
      render: (size) => formatFileSize(size),
      sorter: true,
    },
    {
      title: '上传用户',
      dataIndex: 'userAccount',
      key: 'userAccount',
      width: 120,
      hideInSearch: true,
    },
    {
      title: '业务描述',
      dataIndex: 'business',
      key: 'business',
      width: 150,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 180,
      valueType: 'dateTime',
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      hideInSearch: true,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="text"
              size="small"
              icon={<FileOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Tooltip title="已上传的文件不允许删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled
              onClick={() => {
                message.warning('已上传的文件不允许删除，删除后可能导致已发布的文章无法正常访问。', 5);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 获取文件列表
  const fetchFiles = async (params, sort) => {
    try {
      const queryParams = {
        ...params,
        page: params.current || 1,
        size: params.pageSize || 10,
      };

      // 处理排序
      if (sort && Object.keys(sort).length > 0) {
        const sortField = Object.keys(sort)[0];
        const sortOrder = sort[sortField] === 'ascend' ? 'asc' : 'desc';
        queryParams.sortField = sortField;
        queryParams.sortOrder = sortOrder;
      }

      const response = await fileService.list(queryParams);

      // 确保返回的数据格式正确
      let data = [];
      let total = 0;
      let success = false;

      if (response) {
        success = response.success;

        // 处理后端返回的数据结构，优先处理 { list: [...], total: number } 格式
        if (response.data && Array.isArray(response.data.list)) {
          // 后端返回的数据结构是 { list: [...], total: number }
          data = response.data.list;
          total = response.data.total || 0;
        } else if (Array.isArray(response.data)) {
          // 如果直接返回数组
          data = response.data;
          total = response.total || response.data.length;
        } else if (response.data && Array.isArray(response.data.records)) {
          // 如果是其他分页数据结构
          data = response.data.records;
          total = response.data.total || 0;
        } else {
          // 如果没有数据或数据格式不正确，返回空数组
          console.warn('Unexpected data format:', response.data);
          data = [];
          total = 0;
        }
      }

      return {
        data: data,
        success: success,
        total: total,
      };
    } catch (error) {
      console.error('获取文件列表失败:', error);
      message.error('获取文件列表失败');
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  // 处理文件上传
  const handleUpload = async (values) => {
    if (!values.file || values.file.length === 0) {
      message.error('请选择要上传的文件');
      return;
    }

    if (!values.business) {
      message.error('请填写业务描述');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();

      // 注意：后端期望的字段名是 'file'，不是 'files'
      values.file.forEach(file => {
        formData.append('file', file.originFileObj);
      });

      // 添加必需的 business 参数
      formData.append('business', values.business);

      // 添加缩略图相关参数
      if (values.needThumbnail) {
        formData.append('needThumbnail', values.needThumbnail);
        if (values.width) formData.append('width', values.width);
        if (values.height) formData.append('height', values.height);
        if (values.quality) formData.append('quality', values.quality);
      }

      const response = await fileService.upload(formData);

      if (response.success) {
        message.success('文件上传成功');
        setUploadModalVisible(false);
        form.resetFields();
        actionRef.current?.reload();
      } else {
        message.error(response.error || '文件上传失败');
      }
    } catch (error) {
      message.error('文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 处理文件下载
  const handleDownload = (record) => {
    try {
      // 选择1：直接使用MinIO URL（当前方案，最高效）
      const downloadUrl = record.url;

      // 选择2：使用重定向接口（更灵活，可以添加访问控制等）
      // const baseUrl = process.env.REACT_APP_API_BASE_URL;
      // const downloadUrl = `${baseUrl}/api/files/file/${record.file_key || record.ossKey}?download=true`;

      if (!downloadUrl) {
        message.error('文件URL不存在');
        return;
      }

      // 创建下载链接
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', record.ossKey);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('开始下载文件');
    } catch (error) {
      console.error('下载失败:', error);
      message.error('文件下载失败');
    }
  };

  // 处理文件预览
  const handlePreview = (record) => {
    setPreviewFile(record);
    setPreviewModalVisible(true);
  };


  // 处理批量下载
  const handleBatchDownload = async () => {
    if (selectedRows.length === 0) {
      message.warning('请选择要下载的文件');
      return;
    }

    message.info('开始批量下载...');

    for (const file of selectedRows) {
      try {
        handleDownload(file);
        // 添加延迟避免浏览器阻止多个下载
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`下载文件 ${file.ossKey} 失败:`, error);
      }
    }
  };

  // 判断是否为图片文件
  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  };

  return (
    <div>
      <ProTable
        columns={columns}
        request={fetchFiles}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          collapsed: false,
          collapseRender: false,
        }}
        form={{
          syncToUrl: false,
          size: 'middle',
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
        }}
        tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
          <Space size={24}>
            <span>
              已选择 <strong>{selectedRowKeys.length}</strong> 项
              <Button type="link" size="small" onClick={onCleanSelected}>
                取消选择
              </Button>
            </span>
          </Space>
        )}
        tableAlertOptionRender={({ selectedRowKeys }) => (
          <Space size={16}>
            <Button
              size="small"
              onClick={handleBatchDownload}
              icon={<DownloadOutlined />}
            >
              批量下载
            </Button>
            <Tooltip title="已上传的文件不允许删除">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled
                onClick={() => {
                  message.warning('已上传的文件不允许删除，删除后可能导致已发布的文章无法正常访问。', 5);
                }}
              >
                批量删除
              </Button>
            </Tooltip>
          </Space>
        )}
        toolBarRender={() => [
          <div key="actions" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              上传文件
            </Button>
          </div>,
        ]}
        options={{
          reload: true,
          density: true,
          fullScreen: true,
          setting: true,
        }}
      />

      {/* 文件上传模态框 */}
      <Modal
        title="上传文件"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Form.Item
            name="business"
            label="业务描述"
            rules={[{ required: true, message: '请填写业务描述' }]}
            extra="必填，用于标识文件的业务用途"
          >
            <Input placeholder="请输入业务描述，如：用户头像、产品图片等" />
          </Form.Item>

          <Form.Item
            name="file"
            label="选择文件"
            rules={[{ required: true, message: '请选择要上传的文件' }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e && e.fileList;
            }}
          >
            <Upload.Dragger
              multiple
              beforeUpload={() => false}
              maxCount={10}
              accept="*/*"
              style={{ padding: '20px' }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: '48px' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持单个或批量上传，最多可选择10个文件
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Collapse ghost>
            <Panel header="生成缩略图设置（可选）" key="thumbnail">
              <Form.Item
                name="needThumbnail"
                label="生成缩略图"
                valuePropName="checked"
              >
                <Checkbox>需要生成缩略图</Checkbox>
              </Form.Item>

              <Form.Item
                name="width"
                label="缩略图宽度"
                extra="仅在生成缩略图时有效"
              >
                <InputNumber
                  placeholder="请输入宽度（像素）"
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="height"
                label="缩略图高度"
                extra="仅在生成缩略图时有效"
              >
                <InputNumber
                  placeholder="请输入高度（像素）"
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="quality"
                label="缩略图质量"
                extra="仅在生成缩略图时有效，范围1-100"
              >
                <InputNumber
                  placeholder="请输入质量（1-100）"
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Panel>
          </Collapse>
        </Form>
      </Modal>

      {/* 文件预览模态框 */}
      <Modal
        title={`预览文件: ${previewFile?.ossKey || ''}`}
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setPreviewFile(null);
        }}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => handleDownload(previewFile)}>
            下载
          </Button>,
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {previewFile && (
          <div style={{ textAlign: 'center' }}>
            {isImageFile(previewFile.ossKey) ? (
              <OssImage
                src={previewFile.thumbnail_url || previewFile.url}
                alt={previewFile.ossKey}
                style={{ maxWidth: '100%', maxHeight: '500px' }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
              />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <FileOutlined style={{ fontSize: '64px', opacity: 0.3 }} />
                <p style={{ marginTop: '16px', opacity: 0.65 }}>
                  此文件类型不支持预览，请下载后查看
                </p>
                <p style={{ opacity: 0.65 }}>
                  文件大小: {formatFileSize(previewFile.size)}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FilePage;
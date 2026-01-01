import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Tag, message, Statistic, Card, Row, Col, Modal } from 'antd';
import { ReloadOutlined, CloudUploadOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import BackupService from '../../../services/BackupService';
import { useMount } from '../../../shared/hooks';

/**
 * 数据库备份 ProTable 组件
 * 实现备份列表展示、手动备份、下载等功能
 */
const DatabaseBackupProTable = () => {
  const actionRef = useRef();
  const [triggering, setTriggering] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [stats, setStats] = useState({
    totalBackups: 0,
    totalSize: 0,
    autoBackups: 0,
    manualBackups: 0,
    newestBackup: null,
  });

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await BackupService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('获取备份统计失败:', error);
    }
  };

  // 组件挂载时加载统计信息
  useMount(() => {
    loadStats();
  });

  // 手动触发备份
  const handleTriggerBackup = async () => {
    Modal.confirm({
      title: '确认备份',
      content: '确定要立即执行数据库备份吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          setTriggering(true);
          const response = await BackupService.triggerBackup();

          if (response.success) {
            message.success('备份任务已触发，正在后台执行');
            // 延迟刷新列表，给备份任务一些执行时间
            setTimeout(() => {
              actionRef.current?.reload();
              loadStats();
            }, 2000);
          } else {
            message.error(response.message || '触发备份失败');
          }
        } catch (error) {
          console.error('触发备份失败:', error);
          message.error('触发备份失败');
        } finally {
          setTriggering(false);
        }
      },
    });
  };

  // 下载备份文件（后端自动解密）
  const handleDownload = async (record) => {
    Modal.confirm({
      title: '确认下载备份文件',
      content: (
        <div>
          <p>确定要下载备份文件 <strong>{record.fileName}</strong> 吗？</p>
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>
            <strong>注意：</strong>此操作将被记录到系统操作日志中，包括您的用户信息、操作时间和IP地址等信息。
          </p>
        </div>
      ),
      okText: '确认下载',
      cancelText: '取消',
      onOk: async () => {
        try {
          setDownloading((prev) => ({ ...prev, [record.fileKey]: true }));
          message.loading({ content: '正在下载并解密...', key: 'download' });

          const result = await BackupService.downloadBackup(record.fileKey);

          if (result.success) {
            message.success({ content: '下载成功', key: 'download', duration: 2 });
          } else {
            message.error({ content: result.error || '下载失败', key: 'download' });
          }
        } catch (error) {
          console.error('下载失败:', error);
          message.error({ content: '下载失败', key: 'download' });
        } finally {
          setDownloading((prev) => ({ ...prev, [record.fileKey]: false }));
        }
      },
    });
  };

  // 备份类型枚举
  const backupTypeEnum = {
    auto: { text: '自动备份', status: 'Processing' },
    manual: { text: '手动备份', status: 'Success' },
  };

  // 列配置
  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 300,
      ellipsis: true,
      copyable: true,
      search: false,
    },
    {
      title: '备份类型',
      dataIndex: 'backupType',
      key: 'backupType',
      width: 120,
      valueType: 'select',
      valueEnum: backupTypeEnum,
      render: (_, record) => (
        <Tag color={record.backupType === 'auto' ? 'blue' : 'green'}>
          {record.backupType === 'auto' ? '自动备份' : '手动备份'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '日期范围',
      dataIndex: 'createdAt',
      key: 'createdAtRange',
      valueType: 'dateRange',
      hideInTable: true,
      fieldProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 120,
      search: false,
      render: (_, record) => formatFileSize(record.fileSize),
    },
    {
      title: '存储位置',
      dataIndex: 'storageProvider',
      key: 'storageProvider',
      width: 120,
      search: false,
      render: (_, record) => record.storageProvider || 'OSS',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Button
          type="link"
          icon={<DownloadOutlined />}
          loading={downloading[record.fileKey]}
          onClick={() => handleDownload(record)}
        >
          下载
        </Button>
      ),
    },
  ];

  // 请求数据
  const request = async (params, sort) => {
    try {
      const { current, pageSize, backupType, createdAtRange } = params;

      const queryParams = {
        page: current,
        size: pageSize,
        backupType,
      };

      // 日期范围处理
      if (createdAtRange && createdAtRange.length === 2) {
        queryParams.startDate = createdAtRange[0];
        queryParams.endDate = createdAtRange[1];
      }

      const response = await BackupService.list(queryParams);

      if (response.success) {
        return {
          data: response.data?.list || [],
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
      console.error('获取备份列表失败:', error);
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
              title="总备份数"
              value={stats.totalBackups}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总大小"
              value={formatFileSize(stats.totalSize)}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="自动备份"
              value={stats.autoBackups}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="手动备份"
              value={stats.manualBackups}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 备份列表 */}
      <ProTable
        columns={columns}
        actionRef={actionRef}
        request={request}
        rowKey="fileKey"
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
        headerTitle="数据库备份列表"
        toolBarRender={() => [
          <Button
            key="trigger"
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={handleTriggerBackup}
            loading={triggering}
          >
            手动备份
          </Button>,
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
        scroll={{ x: 1200 }}
        options={{
          reload: true,
          density: true,
          setting: true,
        }}
      />
    </>
  );
};

export default DatabaseBackupProTable;

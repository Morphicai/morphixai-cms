import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Tag, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import OperationLogService from '../../../services/OperationLogService';
import { exportToCSV } from '../../../utils/exportUtils';
import LogDetailDrawer from './LogDetailDrawer';

/**
 * 操作日志 ProTable 组件
 * 使用 ProTable 实现操作日志列表管理
 */
const OperationLogProTable = () => {
  const actionRef = useRef();
  const [exporting, setExporting] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);

  // 模块枚举
  const moduleEnum = {
    user: { text: '用户管理' },
    role: { text: '角色管理' },
    menu: { text: '菜单管理' },
    article: { text: '文章管理' },
    category: { text: '分类管理' },
    document: { text: '文档管理' },
    product: { text: '产品管理' },
    contact: { text: '联系人管理' },
    order: { text: '订单管理' },
    character: { text: '角色管理' },
    guild: { text: '公会管理' },
    server: { text: '服务器管理' },
  };

  // 操作类型枚举
  const actionEnum = {
    create: { text: '创建', status: 'Success' },
    update: { text: '更新', status: 'Processing' },
    delete: { text: '删除', status: 'Error' },
    view: { text: '查看', status: 'Default' },
    login: { text: '登录', status: 'Success' },
    logout: { text: '登出', status: 'Default' },
    export: { text: '导出', status: 'Processing' },
    import: { text: '导入', status: 'Processing' },
  };

  // 状态枚举
  const statusEnum = {
    success: { text: '成功', status: 'Success' },
    failed: { text: '失败', status: 'Error' },
  };

  // 处理行点击
  const handleRowClick = (record) => {
    setSelectedLogId(record.id);
    setDrawerVisible(true);
  };

  // 关闭抽屉
  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedLogId(null);
  };

  // 处理导出
  const handleExport = async () => {
    try {
      setExporting(true);
      
      const response = await OperationLogService.exportLogs(currentFilters);
      
      if (response.success) {
        const filename = `operation-logs-${dayjs().format('YYYY-MM-DD-HHmmss')}.csv`;
        exportToCSV(response.data, filename);
        message.success('导出成功');
      } else {
        message.error('导出失败');
      }
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  // 列配置
  const columns = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: '搜索描述或错误信息',
      },
    },
    {
      title: '操作时间',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 180,
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
      render: (_, record) => dayjs(record.createDate).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '日期范围',
      dataIndex: 'createDate',
      key: 'createDateRange',
      valueType: 'dateRange',
      hideInTable: true,
      fieldProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
      ellipsis: true,
      copyable: true,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      valueType: 'select',
      valueEnum: moduleEnum,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      valueType: 'select',
      valueEnum: actionEnum,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, record) => (
        <Tag color={record.status === 'success' ? 'success' : 'error'}>
          {record.status === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '耗时(ms)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      sorter: true,
      search: false,
      render: (_, record) => record.duration || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
      search: false,
      ellipsis: true,
      copyable: true,
    },
  ];

  // 请求数据
  const request = async (params, sort) => {
    try {
      const { current, pageSize, userId, module, action, status, createDateRange, keyword } = params;

      const queryParams = {
        page: current,
        pageSize,
        userId,
        module,
        action,
        status,
        keyword,
      };

      // 日期范围处理
      if (createDateRange && createDateRange.length === 2) {
        queryParams.startDate = createDateRange[0];
        queryParams.endDate = createDateRange[1];
      }

      // 排序处理
      if (sort && Object.keys(sort).length > 0) {
        const sortField = Object.keys(sort)[0];
        const sortOrder = sort[sortField] === 'ascend' ? 'ASC' : 'DESC';
        queryParams.sortBy = sortField;
        queryParams.sortOrder = sortOrder;
      } else {
        // 默认按操作时间降序排序
        queryParams.sortBy = 'createDate';
        queryParams.sortOrder = 'DESC';
      }

      // 保存当前筛选条件用于导出
      setCurrentFilters(queryParams);

      const response = await OperationLogService.list(queryParams);

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
      console.error('获取操作日志列表失败:', error);
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
          pageSizeOptions: ['20', '50', '100'],
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
        headerTitle="操作日志列表"
        toolBarRender={() => [
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            导出
          </Button>,
        ]}
        scroll={{ x: 1200 }}
        options={{
          reload: true,
          density: true,
          setting: true,
        }}
        rowClassName={(record) => {
          return record.status === 'failed' ? 'row-failed' : '';
        }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' },
        })}
      />
      
      <LogDetailDrawer
        visible={drawerVisible}
        logId={selectedLogId}
        onClose={handleDrawerClose}
      />
    </>
  );
};

export default OperationLogProTable;

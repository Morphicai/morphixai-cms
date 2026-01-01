import React, { useState, useCallback } from 'react';
import { Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import adminPartnerService from '../../../services/AdminPartnerService';
import { useMount } from '../../../shared/hooks';

const TaskLogs = ({ partnerId }) => {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchData = useCallback(async (page, pageSize) => {
    try {
      setLoading(true);
      const response = await adminPartnerService.getTaskLogs(
        partnerId,
        page,
        pageSize
      );

      if (response?.data) {
        setDataSource(response.data.items || []);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize,
          total: response.data.pagination?.total || 0,
        }));
      }
    } catch (error) {
      message.error('获取任务日志失败');
      console.error('Failed to fetch task logs:', error);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useMount(() => {
    fetchData(pagination.current, pagination.pageSize);
  });

  const handleTableChange = (newPagination) => {
    fetchData(newPagination.current, newPagination.pageSize);
  };

  const renderTaskType = (taskType) => {
    const typeConfig = {
      register: { color: 'blue', text: '注册任务' },
      invite_success: { color: 'green', text: '邀请任务' },
      game_action: { color: 'purple', text: '游戏行为' },
      external_task: { color: 'orange', text: '外部任务' },
    };
    const config = typeConfig[taskType] || { color: 'default', text: taskType };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const renderStatus = (status) => {
    const statusConfig = {
      completed: { color: 'success', text: '已完成' },
      pending: { color: 'processing', text: '待处理' },
      failed: { color: 'error', text: '失败' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '任务代码',
      dataIndex: 'taskCode',
      key: 'taskCode',
      width: 150,
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 120,
      render: renderTaskType,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 100,
      render: (points) => `${points} MIRA`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatus,
    },
    {
      title: '贡献者',
      key: 'contributor',
      width: 150,
      render: (_, record) => {
        if (record.relatedPartnerId) {
          return (
            <div>
              <div>{record.relatedUid || '-'}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                ID: {record.relatedPartnerId}
              </div>
            </div>
          );
        }
        return <Tag color="blue">自己</Tag>;
      },
    },
    {
      title: '完成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '业务参数',
      dataIndex: 'businessParams',
      key: 'businessParams',
      ellipsis: true,
      render: (params) => {
        if (!params) return '-';
        return (
          <div style={{ fontSize: '12px', color: '#666' }}>
            {JSON.stringify(params)}
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey="id"
      pagination={{
        ...pagination,
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条`,
      }}
      onChange={handleTableChange}
      scroll={{ x: 1200 }}
    />
  );
};

export default TaskLogs;

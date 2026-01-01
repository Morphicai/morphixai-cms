import { useState, useCallback } from 'react';
import { Table, message } from 'antd';
import dayjs from 'dayjs';
import adminPartnerService from '../../../services/AdminPartnerService';
import { useMount } from '../../../shared/hooks';

const PointsHistory = ({ partnerId }) => {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchPoints = useCallback(async (page, pageSize) => {
    try {
      setLoading(true);
      const response = await adminPartnerService.getPoints(partnerId, {
        page,
        pageSize,
      });

      if (response?.data) {
        setDataSource(response.data.transactions || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize,
          total: response.data.pagination?.total || 0,
        }));
      }
    } catch (error) {
      message.error('获取积分明细失败');
      console.error('Failed to fetch points history:', error);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useMount(() => {
    fetchPoints(pagination.current, pagination.pageSize);
  });

  const handleTableChange = (newPagination) => {
    fetchPoints(newPagination.current, newPagination.pageSize);
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 150,
      render: (type) => {
        const typeMap = {
          INVITE_SUCCESS: '邀请成功',
          REGISTER: '注册',
          GAME_ACTION: '游戏行为',
          EXTERNAL_TASK: '外部任务',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '任务代码',
      dataIndex: 'taskCode',
      key: 'taskCode',
      width: 120,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 120,
      render: (points) => (
        <span style={{ color: '#3f8600' }}>+{points} MIRA</span>
      ),
    },
    {
      title: '业务参数',
      dataIndex: 'businessParams',
      key: 'businessParams',
      ellipsis: true,
      render: (params) => {
        if (!params) return '-';
        return JSON.stringify(params);
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={pagination}
      onChange={handleTableChange}
      rowKey="id"
    />
  );
};

export default PointsHistory;

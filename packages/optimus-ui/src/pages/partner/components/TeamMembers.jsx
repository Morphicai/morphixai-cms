import React, { useState, useCallback } from 'react';
import { Table, Tabs, Tag, message } from 'antd';
import dayjs from 'dayjs';
import adminPartnerService from '../../../services/AdminPartnerService';
import { useMount } from '../../../shared/hooks';

const TeamMembers = ({ partnerId }) => {
  const [activeLevel, setActiveLevel] = useState('1');
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchTeam = useCallback(async (level, page, pageSize) => {
    try {
      setLoading(true);
      const response = await adminPartnerService.getTeam(partnerId, {
        level: parseInt(level),
        page,
        pageSize,
      });

      if (response?.data) {
        setDataSource(response.data.list || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      message.error('获取团队成员失败');
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useMount(() => {
    fetchTeam(activeLevel, pagination.current, pagination.pageSize);
  });

  const handleTabChange = (key) => {
    setActiveLevel(key);
    fetchTeam(key, 1, pagination.pageSize);
  };

  const handleTableChange = (newPagination) => {
    fetchTeam(activeLevel, newPagination.current, newPagination.pageSize);
  };

  const columns = [
    {
      title: '合伙人编号',
      dataIndex: 'partnerCode',
      key: 'partnerCode',
      width: 150,
    },
    {
      title: 'UID',
      dataIndex: 'uid',
      key: 'uid',
      width: 120,
    },
    {
      title: '当前星级',
      dataIndex: 'currentStar',
      key: 'currentStar',
      width: 100,
    },
    {
      title: '累计积分',
      dataIndex: 'totalMira',
      key: 'totalMira',
      width: 120,
      render: (value) => `${value || 0} MIRA`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          active: { color: 'success', text: '活跃' },
          frozen: { color: 'warning', text: '冻结' },
          deleted: { color: 'default', text: '已删除' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '加入时间',
      dataIndex: 'joinTime',
      key: 'joinTime',
      width: 180,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '来源渠道',
      dataIndex: 'sourceChannelName',
      key: 'sourceChannelName',
      width: 150,
      render: (text) => text || '-',
    },
  ];

  const tabItems = [
    {
      key: '1',
      label: '一级下线',
      children: (
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="partnerId"
        />
      ),
    },
    {
      key: '2',
      label: '二级下线',
      children: (
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="partnerId"
        />
      ),
    },
  ];

  return (
    <Tabs
      activeKey={activeLevel}
      items={tabItems}
      onChange={handleTabChange}
    />
  );
};

export default TeamMembers;

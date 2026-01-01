import React, { useState, useCallback } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Alert,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  DeleteOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import adminPartnerService from '../../services/AdminPartnerService';
import { useMount } from '../../shared/hooks';
import PartnerDetail from './PartnerDetail';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const PartnerList = () => {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);

  const fetchList = useCallback(async (page, pageSize, searchFilters) => {
    try {
      setLoading(true);
      // 过滤掉空值参数
      const params = {
        page,
        pageSize,
      };
      if (searchFilters.keyword) {
        params.keyword = searchFilters.keyword;
      }
      if (searchFilters.status) {
        params.status = searchFilters.status;
      }
      const response = await adminPartnerService.list(params);

      if (response?.data) {
        setDataSource(response.data.items || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      message.error('获取合伙人列表失败');
      console.error('Failed to fetch partner list:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useMount(() => {
    fetchList(pagination.current, pagination.pageSize, filters);
  });

  const handleSearch = keyword => {
    const newFilters = { ...filters, keyword };
    setFilters(newFilters);
    fetchList(1, pagination.pageSize, newFilters);
  };

  const handleStatusChange = status => {
    const newFilters = { ...filters, status: status || undefined };
    setFilters(newFilters);
    fetchList(1, pagination.pageSize, newFilters);
  };

  const handleTableChange = newPagination => {
    fetchList(newPagination.current, newPagination.pageSize, filters);
  };

  const handleViewDetail = partnerId => {
    setSelectedPartnerId(partnerId);
    setDetailVisible(true);
  };

  const handleDetailClose = () => {
    setDetailVisible(false);
    setSelectedPartnerId(null);
  };

  const handleRefresh = () => {
    fetchList(pagination.current, pagination.pageSize, filters);
  };

  const handleRefreshCache = () => {
    Modal.confirm({
      title: '确认刷新缓存',
      icon: <ReloadOutlined />,
      content:
        '刷新缓存后，所有合伙人的积分数据将在下次查询时重新计算。是否继续？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await adminPartnerService.refreshCache();
          if (response?.code === 200) {
            message.success('积分缓存已刷新');
            // 刷新当前列表
            fetchList(pagination.current, pagination.pageSize, filters);
          } else {
            message.error(response?.message || '刷新缓存失败');
          }
        } catch (error) {
          message.error('刷新缓存失败');
          console.error('Failed to refresh cache:', error);
        }
      },
    });
  };

  const handleClearAllData = () => {
    let reason = '';
    let confirmText = '';

    const modal = Modal.confirm({
      title: (
        <Space>
          <WarningOutlined style={{ color: '#ff4d4f' }} />
          <span>清空所有合伙人数据</span>
        </Space>
      ),
      icon: null,
      width: 600,
      content: (
        <div>
          <Alert
            message="极度危险操作"
            description="此操作将清空所有合伙人的业务数据，包括层级关系、推广渠道、任务记录、积分等。此操作不可恢复！"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#ff4d4f' }}>*</span>{' '}
                清空原因（至少20个字符）：
              </div>
              <TextArea
                rows={3}
                placeholder="请输入清空原因，例如：测试环境数据清理，准备重新开始测试"
                onChange={e => (reason = e.target.value)}
              />
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#ff4d4f' }}>*</span> 确认文本（请输入
                "CLEAR_ALL_PARTNER_DATA"）：
              </div>
              <Input
                placeholder="CLEAR_ALL_PARTNER_DATA"
                onChange={e => (confirmText = e.target.value)}
              />
            </div>
          </Space>
        </div>
      ),
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        // 验证输入
        if (!reason || reason.length < 20) {
          message.error('清空原因至少需要20个字符');
          throw new Error('清空原因至少需要20个字符');
        }
        if (confirmText !== 'CLEAR_ALL_PARTNER_DATA') {
          message.error('确认文本错误，请输入 "CLEAR_ALL_PARTNER_DATA"');
          throw new Error('确认文本错误');
        }

        // 执行清空操作
        const response = await adminPartnerService.clearAllData({
          reason,
          confirmText,
        });

        if (response?.code === 200) {
          modal.destroy();
          Modal.success({
            title: '清空成功',
            content: (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="清空档案数">
                  {response.data.clearedProfiles}
                </Descriptions.Item>
                <Descriptions.Item label="清空层级关系">
                  {response.data.clearedHierarchies}
                </Descriptions.Item>
                <Descriptions.Item label="清空推广渠道">
                  {response.data.clearedChannels}
                </Descriptions.Item>
                <Descriptions.Item label="清空任务记录">
                  {response.data.clearedTaskLogs}
                </Descriptions.Item>
              </Descriptions>
            ),
          });
          // 刷新列表
          fetchList(pagination.current, pagination.pageSize, filters);
        } else {
          throw new Error(response?.message || '清空数据失败');
        }
      },
      onCancel: () => {
        modal.destroy();
      },
    });
  };

  const columns = [
    {
      title: '合伙人编号',
      dataIndex: 'partnerCode',
      key: 'partnerCode',
      width: 150,
      fixed: 'left',
    },
    {
      title: 'UID',
      dataIndex: 'uid',
      key: 'uid',
      width: 120,
    },
    {
      title: '上级编号',
      dataIndex: 'uplinkPartnerCode',
      key: 'uplinkPartnerCode',
      width: 150,
      render: text => text || '-',
    },
    {
      title: '当前星级',
      dataIndex: 'currentStar',
      key: 'currentStar',
      width: 100,
    },
    {
      title: '一级下线',
      dataIndex: 'totalL1',
      key: 'totalL1',
      width: 100,
      render: value => value || 0,
    },
    {
      title: '二级下线',
      dataIndex: 'totalL2',
      key: 'totalL2',
      width: 100,
      render: value => value || 0,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: status => {
        const statusConfig = {
          active: { color: 'success', text: '活跃' },
          frozen: { color: 'warning', text: '冻结' },
          deleted: { color: 'default', text: '已删除' },
        };
        const config = statusConfig[status] || {
          color: 'default',
          text: status,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '加入时间',
      dataIndex: 'joinTime',
      key: 'joinTime',
      width: 180,
      render: text => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: text => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.partnerId)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Search
          placeholder="搜索合伙人编号或UID"
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 300 }}
          onSearch={handleSearch}
        />
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 150 }}
          onChange={handleStatusChange}
          value={filters.status || undefined}
        >
          <Option value="active">活跃</Option>
          <Option value="frozen">冻结</Option>
          <Option value="deleted">已删除</Option>
        </Select>
        <Button icon={<ReloadOutlined />} onClick={handleRefreshCache}>
          刷新缓存
        </Button>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={handleClearAllData}
        >
          清空所有数据
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="partnerId"
        scroll={{ x: 1600 }}
      />

      {detailVisible && (
        <PartnerDetail
          partnerId={selectedPartnerId}
          visible={detailVisible}
          onClose={handleDetailClose}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default PartnerList;

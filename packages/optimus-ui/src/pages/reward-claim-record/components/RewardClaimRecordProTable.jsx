import { useRef } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Tag, Button, Popconfirm, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import RewardClaimRecordService from '../../../services/RewardClaimRecordService';

/**
 * 状态枚举
 */
const STATUS_ENUM = {
  claiming: { text: '领取中', color: 'processing' },
  claimed: { text: '已发放', color: 'success' },
  failed: { text: '领取失败', color: 'error' },
};

/**
 * 活动类型枚举
 */
const ACTIVITY_TYPE_ENUM = {
  welfare_claim: { text: '福利领取' },
  recharge_rebate: { text: '充值返利' },
};

/**
 * 奖励发放记录 ProTable 组件（只读）
 */
const RewardClaimRecordProTable = () => {
  const actionRef = useRef();

  // 删除记录
  const handleDelete = async (record) => {
    try {
      const result = await RewardClaimRecordService.delete(record.id);
      if (result.success) {
        message.success(result.message || '删除成功');
        actionRef.current?.reload();
      } else {
        message.error(result.error || '删除失败');
      }
    } catch (error) {
      message.error('删除失败：' + error.message);
    }
  };

  // 列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '用户ID',
      dataIndex: 'uid',
      key: 'uid',
      width: 150,
      copyable: true,
      fieldProps: {
        placeholder: '请输入用户ID',
      },
    },
    {
      title: '活动代码',
      dataIndex: 'activityCode',
      key: 'activityCode',
      width: 200,
      copyable: true,
      fieldProps: {
        placeholder: '请输入活动代码',
      },
    },
    {
      title: '活动类型',
      dataIndex: 'activityType',
      key: 'activityType',
      width: 120,
      valueType: 'select',
      valueEnum: ACTIVITY_TYPE_ENUM,
      hideInTable: true, // 不在表格中显示，只用于筛选
    },
    {
      title: '角色ID',
      dataIndex: 'roleId',
      key: 'roleId',
      width: 150,
      hideInSearch: true,
    },
    {
      title: '服务器ID',
      dataIndex: 'serverId',
      key: 'serverId',
      width: 150,
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: STATUS_ENUM,
      render: (_, record) => {
        const statusInfo = STATUS_ENUM[record.status] || { text: record.status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '奖励信息',
      dataIndex: 'rewards',
      key: 'rewards',
      width: 300,
      hideInSearch: true,
      render: (rewards) => {
        if (!rewards || !Array.isArray(rewards)) return '-';
        return rewards.map((reward, index) => (
          <Tag key={index} style={{ marginBottom: 4 }}>
            {reward.name} x {reward.quantity}
          </Tag>
        ));
      },
    },
    {
      title: '开始领取时间',
      dataIndex: 'claimStartTime',
      key: 'claimStartTime',
      width: 180,
      hideInSearch: true,
      render: (_, record) => {
        return record.claimStartTime
          ? dayjs(record.claimStartTime).format('YYYY-MM-DD HH:mm:ss')
          : '-';
      },
    },
    {
      title: '成功时间',
      dataIndex: 'claimSuccessTime',
      key: 'claimSuccessTime',
      width: 180,
      hideInSearch: true,
      render: (_, record) => {
        return record.claimSuccessTime
          ? dayjs(record.claimSuccessTime).format('YYYY-MM-DD HH:mm:ss')
          : '-';
      },
    },
    {
      title: '失败时间',
      dataIndex: 'claimFailTime',
      key: 'claimFailTime',
      width: 180,
      hideInSearch: true,
      render: (_, record) => {
        return record.claimFailTime
          ? dayjs(record.claimFailTime).format('YYYY-MM-DD HH:mm:ss')
          : '-';
      },
    },
    {
      title: '失败原因',
      dataIndex: 'failReason',
      key: 'failReason',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
      render: (text) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => {
        return record.createDate
          ? dayjs(record.createDate).format('YYYY-MM-DD HH:mm:ss')
          : '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      hideInSearch: true,
      render: (_, record) => (
        <Popconfirm
          title="确认删除"
          description="确定要删除这条奖励发放记录吗？"
          onConfirm={() => handleDelete(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
          >
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // 请求数据
  const request = async (params) => {
    try {
      const { current = 1, pageSize = 10, uid, activityCode, activityType, status } = params;

      const queryParams = {
        page: current || 1,
        pageSize: pageSize || 10,
        uid,
        activityCode,
        activityType,
        status,
      };

      const response = await RewardClaimRecordService.list(queryParams);

      if (response.success) {
        return {
          data: response.data || [],
          success: true,
          total: response.total || 0,
        };
      }

      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error) {
      console.error('获取奖励发放记录列表失败:', error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <ProTable
      columns={columns}
      actionRef={actionRef}
      request={request}
      rowKey="id"
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条记录`,
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
      headerTitle="奖励发放记录"
      options={{
        reload: true,
        density: true,
        fullScreen: true,
        setting: true,
      }}
    />
  );
};

export default RewardClaimRecordProTable;


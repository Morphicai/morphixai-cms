import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Modal, message, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ActivityService from '../../../services/ActivityService';
import ActivityFormModal from './ActivityFormModal';

/**
 * 活动类型枚举
 */
const ACTIVITY_TYPE_ENUM = {
  welfare_claim: { text: '福利领取', color: 'blue' },
  recharge_rebate: { text: '充值返利', color: 'green' },
};

/**
 * 活动状态枚举
 */
const ACTIVITY_STATUS_ENUM = {
  enabled: { text: '开启', color: 'success' },
  disabled: { text: '关闭', color: 'default' },
};



/**
 * 活动管理 ProTable 组件
 */
const ActivityProTable = () => {
  const actionRef = useRef();
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // 处理创建
  const handleCreate = () => {
    setEditingRecord(null);
    setFormModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormModalVisible(true);
  };

  // 处理开启活动
  const handleEnable = (record) => {
    Modal.confirm({
      title: '确认开启',
      content: `确定要开启活动"${record.name}"吗？开启后用户将可以参与该活动。`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await ActivityService.updateStatus(record.id, 'enabled');
          if (result.success) {
            message.success('活动已开启');
            actionRef.current?.reload();
          } else {
            message.error(result.error || '开启失败');
          }
        } catch (error) {
          console.error('开启活动失败:', error);
          message.error('开启失败：' + (error.message || '未知错误'));
        }
      },
    });
  };

  // 处理关闭活动
  const handleDisable = (record) => {
    Modal.confirm({
      title: '确认关闭',
      content: `确定要关闭活动"${record.name}"吗？关闭后用户将无法参与该活动。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await ActivityService.updateStatus(record.id, 'disabled');
          if (result.success) {
            message.success('活动已关闭');
            actionRef.current?.reload();
          } else {
            message.error(result.error || '关闭失败');
          }
        } catch (error) {
          console.error('关闭活动失败:', error);
          message.error('关闭失败：' + (error.message || '未知错误'));
        }
      },
    });
  };

  // 处理删除（软删除）
  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除活动"${record.name}"吗？删除后活动将被隐藏，但数据会保留。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await ActivityService.delete(record.id);
          if (result.success) {
            message.success('删除成功（已软删除）');
            actionRef.current?.reload();
          } else {
            message.error(result.error || '删除失败');
          }
        } catch (error) {
          console.error('删除活动失败:', error);
          message.error('删除失败：' + (error.message || '未知错误'));
        }
      },
    });
  };

  // 处理表单提交成功
  const handleFormSuccess = () => {
    setFormModalVisible(false);
    setEditingRecord(null);
    actionRef.current?.reload();
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
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      fieldProps: {
        placeholder: '请输入活动名称',
      },
    },
    {
      title: '活动类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      valueType: 'select',
      valueEnum: ACTIVITY_TYPE_ENUM,
      render: (_, record) => {
        const typeInfo = ACTIVITY_TYPE_ENUM[record.type] || { text: record.type, color: 'default' };
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => {
        return record.startTime ? dayjs(record.startTime).format('YYYY-MM-DD HH:mm:ss') : '-';
      },
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => {
        return record.endTime ? dayjs(record.endTime).format('YYYY-MM-DD HH:mm:ss') : '-';
      },
    },
    {
      title: '时间范围',
      dataIndex: 'timeRange',
      key: 'timeRange',
      valueType: 'dateRange',
      hideInTable: true,
      fieldProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
    {
      title: '活动状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: ACTIVITY_STATUS_ENUM,
      render: (_, record) => {
        const statusInfo = ACTIVITY_STATUS_ENUM[record.status] || { text: record.status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '最大领取次数',
      dataIndex: 'maxClaimTimes',
      key: 'maxClaimTimes',
      width: 140,
      hideInSearch: true,
      render: (_, record) => {
        return `${record.maxClaimTimes || 1} 次/用户`;
      },
    },
    {
      title: '时间状态',
      dataIndex: 'timeStatus',
      key: 'timeStatus',
      width: 100,
      hideInSearch: true,
      render: (_, record) => {
        const now = dayjs();
        const startTime = dayjs(record.startTime);
        const endTime = dayjs(record.endTime);

        if (now.isBefore(startTime)) {
          return <Tag color="default">未开始</Tag>;
        } else if (now.isAfter(endTime)) {
          return <Tag color="error">已过期</Tag>;
        } else {
          return <Tag color="success">时间内</Tag>;
        }
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      key: 'createDate',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => {
        return record.createDate ? dayjs(record.createDate).format('YYYY-MM-DD HH:mm:ss') : '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          {record.status === 'disabled' ? (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleEnable(record)}
            >
              开启
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleDisable(record)}
            >
              关闭
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
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
      const { current = 1, pageSize = 10, activityCode, name, type, timeRange } = params;

      const queryParams = {
        page: current || 1,
        pageSize: pageSize || 10,
        activityCode,
        name,
        type,
      };

      // 处理时间范围
      if (timeRange && timeRange.length === 2) {
        queryParams.startTime = dayjs(timeRange[0]).format('YYYY-MM-DD');
        queryParams.endTime = dayjs(timeRange[1]).format('YYYY-MM-DD');
      }

      const response = await ActivityService.list(queryParams);

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
      console.error('获取活动列表失败:', error);
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
        headerTitle="活动管理"
        toolBarRender={() => [
          <Button
            type="primary"
            key="create"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建活动
          </Button>,
        ]}
      />

      <ActivityFormModal
        visible={formModalVisible}
        record={editingRecord}
        onCancel={() => {
          setFormModalVisible(false);
          setEditingRecord(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};

export default ActivityProTable;


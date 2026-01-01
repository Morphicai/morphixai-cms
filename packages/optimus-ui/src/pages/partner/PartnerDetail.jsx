import React, { useState, useCallback } from 'react';
import {
  Drawer,
  Tabs,
  Descriptions,
  Button,
  Space,
  Tag,
  Modal,
  Input,
  message,
  Spin,
} from 'antd';
import { EditOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import adminPartnerService from '../../services/AdminPartnerService';
import { useMount } from '../../shared/hooks';
import TeamMembers from './components/TeamMembers';
import PointsHistory from './components/PointsHistory';
import ChannelList from './components/ChannelList';
import TaskLogs from './components/TaskLogs';
import InviteTaskAnalysis from './components/InviteTaskAnalysis';

const { TextArea } = Input;

const PartnerDetail = ({ partnerId, visible, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [remarkValue, setRemarkValue] = useState('');
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminPartnerService.getDetail(partnerId);
      if (response?.data) {
        setDetail(response.data);
        setRemarkValue(response.data.remark || '');
      }
    } catch (error) {
      message.error('获取合伙人详情失败');
      console.error('Failed to fetch partner detail:', error);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useMount(() => {
    fetchDetail();
  });

  const handleFreeze = async () => {
    if (!freezeReason.trim()) {
      message.warning('请输入冻结原因');
      return;
    }

    try {
      await adminPartnerService.freeze(partnerId, freezeReason);
      message.success('冻结成功');
      setFreezeModalVisible(false);
      setFreezeReason('');
      fetchDetail();
      onRefresh?.();
    } catch (error) {
      message.error('冻结失败');
      console.error('Failed to freeze partner:', error);
    }
  };

  const handleUnfreeze = async () => {
    Modal.confirm({
      title: '确认解冻',
      content: '确定要解冻此合伙人吗？',
      onOk: async () => {
        try {
          await adminPartnerService.unfreeze(partnerId);
          message.success('解冻成功');
          fetchDetail();
          onRefresh?.();
        } catch (error) {
          message.error('解冻失败');
          console.error('Failed to unfreeze partner:', error);
        }
      },
    });
  };

  const handleUpdateRemark = async () => {
    try {
      await adminPartnerService.updateRemark(partnerId, remarkValue);
      message.success('备注更新成功');
      setRemarkModalVisible(false);
      fetchDetail();
      onRefresh?.();
    } catch (error) {
      message.error('备注更新失败');
      console.error('Failed to update remark:', error);
    }
  };

  const renderStatusTag = (status) => {
    const statusConfig = {
      active: { color: 'success', text: '活跃' },
      frozen: { color: 'warning', text: '冻结' },
      deleted: { color: 'default', text: '已删除' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin />
        </div>
      ) : (
        <Descriptions column={2} bordered>
          <Descriptions.Item label="合伙人编号" span={2}>
            {detail?.partnerCode}
          </Descriptions.Item>
          <Descriptions.Item label="UID">
            {detail?.uid}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {renderStatusTag(detail?.status)}
          </Descriptions.Item>
          <Descriptions.Item label="当前星级">
            {detail?.currentStar || 'NEW'}
          </Descriptions.Item>
          <Descriptions.Item label="累计积分">
            {detail?.totalMira || 0} MIRA
          </Descriptions.Item>
          <Descriptions.Item label="上级合伙人" span={2}>
            {detail?.uplink ? (
              <Space>
                <span>{detail.uplink.partnerCode}</span>
                <span style={{ color: '#999' }}>({detail.uplink.uid})</span>
              </Space>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="一级下线">
            {detail?.totalL1 || 0} 人
          </Descriptions.Item>
          <Descriptions.Item label="二级下线">
            {detail?.totalL2 || 0} 人
          </Descriptions.Item>
          <Descriptions.Item label="来源渠道">
            {detail?.sourceChannelName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="加入时间">
            {detail?.joinTime ? dayjs(detail.joinTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            <Space>
              <span>{detail?.remark || '-'}</span>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => setRemarkModalVisible(true)}
              >
                编辑
              </Button>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'team',
      label: '团队成员',
      children: <TeamMembers partnerId={partnerId} />,
    },
    {
      key: 'points',
      label: '积分明细',
      children: <PointsHistory partnerId={partnerId} />,
    },
    {
      key: 'task-logs',
      label: '任务日志',
      children: <TaskLogs partnerId={partnerId} />,
    },
    {
      key: 'invite-analysis',
      label: '邀请任务分析',
      children: <InviteTaskAnalysis partnerId={partnerId} />,
    },
    {
      key: 'channels',
      label: '推广渠道',
      children: <ChannelList partnerId={partnerId} />,
    },
  ];

  return (
    <>
      <Drawer
        title="合伙人详情"
        width={1000}
        open={visible}
        onClose={onClose}
        extra={
          detail && (
            <Space>
              {detail.status === 'active' && (
                <Button
                  icon={<LockOutlined />}
                  onClick={() => setFreezeModalVisible(true)}
                >
                  冻结
                </Button>
              )}
              {detail.status === 'frozen' && (
                <Button
                  type="primary"
                  icon={<UnlockOutlined />}
                  onClick={handleUnfreeze}
                >
                  解冻
                </Button>
              )}
            </Space>
          )
        }
      >
        <Tabs items={tabItems} />
      </Drawer>

      <Modal
        title="编辑备注"
        open={remarkModalVisible}
        onOk={handleUpdateRemark}
        onCancel={() => setRemarkModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <TextArea
          rows={4}
          value={remarkValue}
          onChange={(e) => setRemarkValue(e.target.value)}
          placeholder="请输入备注信息"
          maxLength={500}
          showCount
        />
      </Modal>

      <Modal
        title="冻结合伙人"
        open={freezeModalVisible}
        onOk={handleFreeze}
        onCancel={() => {
          setFreezeModalVisible(false);
          setFreezeReason('');
        }}
        okText="确认冻结"
        cancelText="取消"
      >
        <TextArea
          rows={4}
          value={freezeReason}
          onChange={(e) => setFreezeReason(e.target.value)}
          placeholder="请输入冻结原因"
          maxLength={200}
          showCount
        />
      </Modal>
    </>
  );
};

export default PartnerDetail;

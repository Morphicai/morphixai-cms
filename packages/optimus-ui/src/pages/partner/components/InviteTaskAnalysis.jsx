import React, { useState, useCallback } from 'react';
import { Card, Button, Table, Space, Alert, message, Modal, Spin } from 'antd';
import { SyncOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import adminPartnerService from '../../../services/AdminPartnerService';
import { useMount } from '../../../shared/hooks';

const InviteTaskAnalysis = ({ partnerId }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      setAnalyzing(true);
      const response = await adminPartnerService.analyzeInviteTasks(partnerId);
      if (response?.data) {
        setAnalysis(response.data);
      }
    } catch (error) {
      message.error('分析邀请任务失败');
      console.error('Failed to analyze invite tasks:', error);
    } finally {
      setAnalyzing(false);
    }
  }, [partnerId]);

  useMount(() => {
    fetchAnalysis();
  });

  const handleFix = async () => {
    Modal.confirm({
      title: '确认修复',
      content: `确定要修复 ${analysis?.missingInviteTasks?.length || 0} 个缺失的邀请任务吗？`,
      okText: '确认修复',
      cancelText: '取消',
      onOk: async () => {
        try {
          setFixing(true);
          const response = await adminPartnerService.fixInviteTasks(partnerId);
          
          if (response?.data) {
            const { fixed, skipped } = response.data;
            message.success(`修复完成：成功 ${fixed} 个，跳过 ${skipped} 个`);
            
            // 重新分析
            await fetchAnalysis();
          }
        } catch (error) {
          message.error('修复失败');
          console.error('Failed to fix invite tasks:', error);
        } finally {
          setFixing(false);
        }
      },
    });
  };

  const columns = [
    {
      title: '下线合伙人编号',
      dataIndex: 'downlinePartnerCode',
      key: 'downlinePartnerCode',
      width: 150,
    },
    {
      title: '下线UID',
      dataIndex: 'downlineUid',
      key: 'downlineUid',
      width: 150,
    },
    {
      title: '加入时间',
      dataIndex: 'joinTime',
      key: 'joinTime',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '下线ID',
      dataIndex: 'downlinePartnerId',
      key: 'downlinePartnerId',
      width: 120,
    },
  ];

  if (analyzing) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin tip="正在分析邀请任务..." />
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const hasMissingTasks = analysis.missingInviteTasks?.length > 0;
  const isConsistent = analysis.totalDownlines === analysis.totalInviteTasks;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>邀请任务一致性分析</h3>
            <Button
              icon={<SyncOutlined />}
              onClick={fetchAnalysis}
              loading={analyzing}
            >
              重新分析
            </Button>
          </div>

          {isConsistent ? (
            <Alert
              message="数据一致"
              description="所有一级下线都有对应的邀请任务记录，数据完整。"
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
            />
          ) : (
            <Alert
              message="发现数据不一致"
              description={`共有 ${analysis.totalDownlines} 个一级下线，但只有 ${analysis.totalInviteTasks} 条邀请任务记录，缺失 ${analysis.missingInviteTasks.length} 条。`}
              type="warning"
              icon={<WarningOutlined />}
              showIcon
            />
          )}

          <div style={{ display: 'flex', gap: '40px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>一级下线总数</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {analysis.totalDownlines}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>邀请任务记录</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {analysis.totalInviteTasks}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666' }}>缺失记录</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: hasMissingTasks ? '#ff4d4f' : '#52c41a' }}>
                {analysis.missingInviteTasks.length}
              </div>
            </div>
          </div>
        </Space>
      </Card>

      {hasMissingTasks && (
        <Card
          title="缺失的邀请任务"
          extra={
            <Button
              type="primary"
              onClick={handleFix}
              loading={fixing}
              disabled={!hasMissingTasks}
            >
              修复缺失任务
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={analysis.missingInviteTasks}
            rowKey="downlinePartnerId"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条缺失记录`,
            }}
          />
        </Card>
      )}
    </Space>
  );
};

export default InviteTaskAnalysis;

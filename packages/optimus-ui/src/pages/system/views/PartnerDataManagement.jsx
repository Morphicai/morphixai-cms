import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Alert,
  Modal,
  Input,
  message,
  Descriptions,
  Tag,
} from 'antd';
import {
  DeleteOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import adminPartnerService from '../../../services/AdminPartnerService';

const { TextArea } = Input;

/**
 * 合伙人数据管理页面
 * 提供数据清理和缓存刷新功能
 */
const PartnerDataManagement = () => {
  const [loading, setLoading] = useState(false);

  // 刷新缓存
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
          setLoading(true);
          const response = await adminPartnerService.refreshCache();
          if (response?.code === 200) {
            message.success('积分缓存已刷新');
          } else {
            message.error(response?.message || '刷新缓存失败');
          }
        } catch (error) {
          message.error('刷新缓存失败');
          console.error('Failed to refresh cache:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 清空所有合伙人数据
  const handleClearAllData = () => {
    let reason = '';
    let confirmText = '';

    Modal.confirm({
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
        if (!reason || reason.length < 20) {
          message.error('清空原因至少需要20个字符');
          return Promise.reject();
        }
        if (confirmText !== 'CLEAR_ALL_PARTNER_DATA') {
          message.error('确认文本错误，请输入 "CLEAR_ALL_PARTNER_DATA"');
          return Promise.reject();
        }

        try {
          setLoading(true);
          const response = await adminPartnerService.clearAllData({
            reason,
            confirmText,
          });
          if (response?.code === 200) {
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
          } else {
            message.error(response?.message || '清空数据失败');
          }
        } catch (error) {
          message.error('清空数据失败');
          console.error('Failed to clear all data:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="合伙人数据管理" bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 缓存管理 */}
          <Card type="inner" title="缓存管理">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="刷新积分缓存"
                description="清空所有合伙人的积分缓存，下次查询时会重新计算。适用于数据异常或系统维护后的缓存更新。"
                type="info"
                showIcon
              />
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRefreshCache}
                loading={loading}
              >
                刷新缓存
              </Button>
            </Space>
          </Card>

          {/* 数据清理 */}
          <Card type="inner" title="数据清理">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="清空所有合伙人数据"
                description={
                  <div>
                    <p>此操作将清空所有合伙人的业务数据，包括：</p>
                    <ul style={{ marginBottom: 0 }}>
                      <li>所有层级关系（上下级关系）</li>
                      <li>所有推广渠道</li>
                      <li>所有任务完成记录</li>
                      <li>所有积分数据和星级</li>
                      <li>所有积分缓存</li>
                    </ul>
                    <p style={{ marginTop: 8, marginBottom: 0 }}>
                      <Tag color="red">极度危险</Tag>
                      <Tag color="orange">不可恢复</Tag>
                      <Tag color="purple">需要环境变量启用</Tag>
                    </p>
                  </div>
                }
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleClearAllData}
                loading={loading}
              >
                清空所有数据
              </Button>
            </Space>
          </Card>

          {/* 使用说明 */}
          <Card type="inner" title="使用说明">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <h4>权限要求：</h4>
                <ul>
                  <li>刷新缓存：普通管理员即可使用</li>
                  <li>
                    清空数据：仅超级管理员可用，且需要环境变量
                    ENABLE_PARTNER_DATA_CLEAR=true
                  </li>
                </ul>
              </div>
              <div>
                <h4>注意事项：</h4>
                <ul>
                  <li>清空数据前请务必确认操作的必要性</li>
                  <li>建议在测试环境使用，生产环境请谨慎操作</li>
                  <li>所有操作都会记录详细的审计日志</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default PartnerDataManagement;

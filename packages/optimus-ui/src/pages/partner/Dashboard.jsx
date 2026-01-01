import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Alert } from 'antd';
import { TeamOutlined, UserOutlined, StarOutlined, TrophyOutlined } from '@ant-design/icons';
import adminPartnerService from '../../services/AdminPartnerService';
import { useMount } from '../../shared/hooks';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminPartnerService.getDashboard();
      console.log('Dashboard response:', response);
      
      if (response?.success && response?.data) {
        setData(response.data);
      } else {
        setError(response?.msg || '加载数据失败');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      setError(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useMount(() => {
    fetchDashboard();
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="合伙人总数"
              value={data?.totalPartners || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃合伙人"
              value={data?.activePartners || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="冻结合伙人"
              value={data?.frozenPartners || 0}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="累计发放积分"
              value={data?.totalPointsDistributed || 0}
              prefix={<TrophyOutlined />}
              suffix="MIRA"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

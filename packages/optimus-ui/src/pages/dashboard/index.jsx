/**
 * 工作台页面
 * 展示系统概览信息和数据统计
 * 只显示真实数据，如果没有真实数据则不显示
 */

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { request } from '../../shared/utils/axios';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [realStats, setRealStats] = useState({
    users: null,
    roles: null
  });

  // 获取真实数据
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);
        
        // 获取用户统计数据
        const userResponse = await request({
          type: 'get',
          url: '/api/user/list',
          data: { page: 1, pageSize: 1 }, // 只获取总数
          showTip: false // 不显示错误提示，静默处理
        });
        
        // 获取角色统计数据
        const roleResponse = await request({
          type: 'get',
          url: '/api/role/list',
          data: { page: 1, pageSize: 1 }, // 只获取总数
          showTip: false // 不显示错误提示，静默处理
        });

        setRealStats({
          users: userResponse.success ? userResponse.data?.total : null,
          roles: roleResponse.success ? roleResponse.data?.total : null
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
        // 静默处理错误，不显示错误消息
        // 如果获取失败，保持为null，不显示数据
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  // 检查是否有任何真实数据可显示
  const hasRealData = realStats.users !== null || realStats.roles !== null;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <Spin size="large" tip="加载统计数据中..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>
        工作台
      </h1>

      {/* 只显示有真实数据的统计卡片 */}
      {hasRealData && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {realStats.users !== null && (
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic
                  title="用户总数"
                  value={realStats.users}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
          )}
          {realStats.roles !== null && (
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic
                  title="角色数量"
                  value={realStats.roles}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* 如果没有真实数据，显示提示信息 */}
      {!hasRealData && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Card>
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                opacity: 0.65
              }}>
                <TrophyOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div style={{ fontSize: '16px' }}>
                  暂无统计数据可显示
                </div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  系统正在收集数据，请稍后查看
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 快捷操作 - 始终显示，因为这些是功能入口 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="快捷操作">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.location.href = '#/sys/user'}
                >
                  <UserOutlined style={{ fontSize: '32px' }} />
                  <div style={{ marginTop: '8px' }}>用户管理</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => window.location.href = '#/sys/role'}
                >
                  <TeamOutlined style={{ fontSize: '32px' }} />
                  <div style={{ marginTop: '8px' }}>角色管理</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
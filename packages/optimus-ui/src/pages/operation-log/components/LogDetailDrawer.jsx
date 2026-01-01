import { Drawer, Descriptions, Card, Alert, Tag, Spin } from 'antd';
import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import OperationLogService from '../../../services/OperationLogService';

/**
 * 操作日志详情抽屉组件
 * 显示操作日志的完整详细信息
 */
const LogDetailDrawer = ({ visible, logId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [logDetail, setLogDetail] = useState(null);

  // 加载日志详情
  const loadLogDetail = useCallback(async () => {
    if (!logId) return;
    
    setLoading(true);
    try {
      const response = await OperationLogService.getDetail(logId);
      if (response.success) {
        setLogDetail(response.data);
      }
    } catch (error) {
      console.error('加载日志详情失败:', error);
    } finally {
      setLoading(false);
    }
  }, [logId]);

  useEffect(() => {
    if (visible && logId) {
      loadLogDetail();
    }
  }, [visible, logId, loadLogDetail]);

  // 格式化 JSON 数据
  const formatJSON = (data) => {
    if (!data) return null;
    try {
      const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
      return JSON.stringify(jsonData, null, 2);
    } catch (error) {
      return String(data);
    }
  };

  return (
    <Drawer
      title="操作日志详情"
      width={720}
      open={visible}
      onClose={onClose}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : logDetail ? (
        <div>
          {/* 基本信息 */}
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="日志ID">{logDetail.id}</Descriptions.Item>
            <Descriptions.Item label="操作时间">
              {dayjs(logDetail.createDate).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">{logDetail.userId}</Descriptions.Item>
            <Descriptions.Item label="模块">{logDetail.module}</Descriptions.Item>
            <Descriptions.Item label="操作">{logDetail.action}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={logDetail.status === 'success' ? 'success' : 'error'}>
                {logDetail.status === 'success' ? '成功' : '失败'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {logDetail.description}
            </Descriptions.Item>
            <Descriptions.Item label="耗时">
              {logDetail.duration ? `${logDetail.duration}ms` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">{logDetail.ip || '-'}</Descriptions.Item>
            <Descriptions.Item label="请求方法">{logDetail.method || '-'}</Descriptions.Item>
            <Descriptions.Item label="请求路径">{logDetail.path || '-'}</Descriptions.Item>
            <Descriptions.Item label="用户代理" span={2}>
              {logDetail.userAgent || '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* 操作前数据 */}
          {logDetail.beforeData && (
            <Card title="操作前数据" style={{ marginTop: 16 }} size="small">
              <pre style={{ 
                margin: 0, 
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px',
                fontSize: '12px',
                lineHeight: '1.5'
              }}>
                {formatJSON(logDetail.beforeData)}
              </pre>
            </Card>
          )}

          {/* 操作后数据 */}
          {logDetail.afterData && (
            <Card title="操作后数据" style={{ marginTop: 16 }} size="small">
              <pre style={{ 
                margin: 0, 
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px',
                fontSize: '12px',
                lineHeight: '1.5'
              }}>
                {formatJSON(logDetail.afterData)}
              </pre>
            </Card>
          )}

          {/* 错误信息 */}
          {logDetail.errorMessage && (
            <Alert
              message="错误信息"
              description={logDetail.errorMessage}
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      ) : null}
    </Drawer>
  );
};

export default LogDetailDrawer;

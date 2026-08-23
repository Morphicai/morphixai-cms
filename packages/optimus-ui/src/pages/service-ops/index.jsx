import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge, Card, Col, Empty, Row, Space, Statistic, Table, Tag, Tooltip, Typography,
} from 'antd';
import { CloudServerOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { serviceOpsApi } from '../../apis/serviceOps';

/**
 * 服务状态面板:探测结果(api 侧 15s 一轮,内存态)+ 事件流(outbox 最近 N 条)。
 * 服务清单不在这里维护——去"数据集合"页改 services-registry,下一轮探测生效。
 * 10s 轮询而不是 websocket:运维速览页,实时性要求就到这,别为它建长连接。
 */
const POLL_MS = 10_000;

const fmtUptime = (sec) => {
  if (sec == null) return '-';
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${(sec / 3600).toFixed(1)}h`;
  return `${(sec / 86400).toFixed(1)}d`;
};

const ServiceCard = ({ s }) => {
  const m = s.metrics || null;
  return (
    <Card size="small" style={{ height: '100%' }}>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space>
          <Badge status={s.ok ? 'success' : 'error'} />
          <Typography.Text strong>{s.name}</Typography.Text>
        </Space>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{s.baseUrl}</Typography.Text>
        {s.ok ? (
          <Space size="large">
            <Statistic title="延迟" value={s.latencyMs} suffix="ms" valueStyle={{ fontSize: 16 }} />
            {m && <Statistic title="内存" value={m.memory?.rssMB} suffix="MB" valueStyle={{ fontSize: 16 }} />}
            {m && <Statistic title="运行" value={fmtUptime(m.uptimeSec)} valueStyle={{ fontSize: 16 }} />}
          </Space>
        ) : (
          <Typography.Text type="danger" style={{ fontSize: 12 }}>{s.error || '不可达'}</Typography.Text>
        )}
        {m?.eventLoopMs && (
          <Tooltip title="事件循环延迟 p50 / p99">
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <ThunderboltOutlined /> loop {m.eventLoopMs.p50}ms / {m.eventLoopMs.p99}ms
              {m.requests && <> · 近1分钟 {m.requests.lastMinute?.count ?? 0} 请求</>}
            </Typography.Text>
          </Tooltip>
        )}
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          探测于 {s.checkedAt?.replace('T', ' ').slice(5, 19)}
        </Typography.Text>
      </Space>
    </Card>
  );
};

const ServiceOps = () => {
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  const load = useCallback(async () => {
    const [s, e] = await Promise.all([serviceOpsApi.status(), serviceOpsApi.events(30)]);
    if (s.success) setServices(s.data || []);
    if (e.success) setEvents(e.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, POLL_MS);
    return () => clearInterval(timer.current);
  }, [load]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        title={<Space><CloudServerOutlined />服务状态</Space>}
        extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>清单在"数据集合 / services-registry"维护,改完下一轮探测生效</Typography.Text>}
        loading={loading}
      >
        {services.length === 0
          ? <Empty description="注册清单为空或探测器未跑完第一轮" />
          : (
            <Row gutter={[16, 16]}>
              {services.map((s) => <Col key={s.key} xs={24} sm={12} lg={6}><ServiceCard s={s} /></Col>)}
            </Row>
          )}
      </Card>

      <Card title="最近事件" size="small">
        <Table
          rowKey="id"
          size="small"
          dataSource={events}
          pagination={false}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 70 },
            { title: '时间', dataIndex: 'createdAt', width: 170, render: (v) => v?.replace('T', ' ').slice(0, 19) },
            { title: '来源', dataIndex: 'source', width: 130, render: (v) => <Tag>{v}</Tag> },
            { title: '类型', dataIndex: 'type', width: 190, render: (v) => <Typography.Text code>{v}</Typography.Text> },
            { title: '发起人', dataIndex: 'by', width: 90 },
            {
              title: '载荷', dataIndex: 'payload', ellipsis: true,
              render: (v) => (v ? <Typography.Text style={{ fontSize: 12 }}>{JSON.stringify(v)}</Typography.Text> : '-'),
            },
          ]}
          locale={{ emptyText: <Empty description="还没有事件(跑一次智能助理任务会产生 agent.run.finished)" /> }}
        />
      </Card>
    </Space>
  );
};

export default ServiceOps;

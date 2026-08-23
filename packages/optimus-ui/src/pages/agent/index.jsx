import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Button, Card, Col, Collapse, Empty, Input, Row, Space, Spin, Table, Tag, Timeline, Typography, message,
} from 'antd';
import { PlayCircleOutlined, RobotOutlined, ToolOutlined } from '@ant-design/icons';
import axios from 'axios';
import storage from '../../shared/utils/storage';

/**
 * 智能助理控制台——agent-service(独立进程 8087,经 /agent-api 同源代理)的前端。
 * 基座只提供运行时,工具是"数据集合"里 agent-tools 的注册行:
 * 想让它多会一样本事,去数据集合加一行工具定义,这个页面和基座都不用改。
 * 请求不走全局 axios 实例:agent-service 有自己的鉴权(introspect),
 * 401 时不应触发管理端的 token 刷新流程。
 */
const agentApi = axios.create({ baseURL: '/agent-api', timeout: 6 * 60_000 });
agentApi.interceptors.request.use((config) => {
  config.headers.Authorization = storage('access-token') || '';
  return config;
});

const STEP_COLOR = { thought: 'blue', tool_call: 'purple', tool_result: 'green', error: 'red' };
const STEP_LABEL = { thought: '思考', tool_call: '调用', tool_result: '结果', error: '错误' };

const renderStep = (s, i) => ({
  key: i,
  color: STEP_COLOR[s.type] || 'gray',
  children: (
    <div>
      <Space size={6}>
        <Tag color={STEP_COLOR[s.type]}>{STEP_LABEL[s.type] || s.type}</Tag>
        {s.tool && <Typography.Text code>{s.tool}</Typography.Text>}
      </Space>
      {s.args !== undefined && (
        <pre style={{ margin: '4px 0 0', fontSize: 12, background: '#fafafa', padding: 8, borderRadius: 6 }}>
          {JSON.stringify(s.args, null, 2)}
        </pre>
      )}
      {s.text && (
        <Typography.Paragraph style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', fontSize: 13 }}>
          {s.text}
        </Typography.Paragraph>
      )}
    </div>
  ),
});

const AgentConsole = () => {
  const [tools, setTools] = useState([]);
  const [toolsErr, setToolsErr] = useState('');
  const [task, setTask] = useState('');
  const [running, setRunning] = useState(false);
  const [run, setRun] = useState(null); // 最近一次执行结果
  const [history, setHistory] = useState([]);

  const loadMeta = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([agentApi.get('/tools'), agentApi.get('/runs')]);
      setTools(t.data?.data || []);
      setHistory(r.data?.data || []);
      setToolsErr('');
    } catch (e) {
      // 服务没起是最常见情况,给一句能操作的话
      setToolsErr(e?.response?.data?.msg || 'agent-service 未启动(packages/agent-service 下 pnpm dev,需注入模型密钥)');
    }
  }, []);
  useEffect(() => { loadMeta(); }, [loadMeta]);

  const handleRun = async () => {
    if (!task.trim()) { message.warning('先描述任务'); return; }
    setRunning(true); setRun(null);
    try {
      const res = await agentApi.post('/run', { task: task.trim() });
      setRun(res.data?.data || null);
      loadMeta();
    } catch (e) {
      message.error(e?.response?.data?.msg || e.message || '执行失败');
    } finally {
      setRunning(false);
    }
  };

  const statusTag = (s) => (
    <Tag color={s === 'success' ? 'green' : s === 'max_steps' ? 'orange' : 'red'}>{s}</Tag>
  );

  return (
    <Row gutter={16}>
      <Col span={16}>
        <Card title={<Space><RobotOutlined />智能助理</Space>}>
          {toolsErr && <Alert type="warning" showIcon message={toolsErr} style={{ marginBottom: 12 }} />}
          <Space.Compact style={{ width: '100%' }}>
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="用自然语言描述任务,例如:检查 portal 命名空间缺少法语(fr-FR)的键并全部翻译"
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
            <Button type="primary" icon={<PlayCircleOutlined />} loading={running} onClick={handleRun} style={{ height: 'auto' }}>
              执行
            </Button>
          </Space.Compact>

          {running && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Spin tip="Agent 执行中(自主调用工具,可能需要一两分钟)..." />
            </div>
          )}

          {run && (
            <div style={{ marginTop: 20 }}>
              <Space style={{ marginBottom: 12 }}>
                {statusTag(run.status)}
                <Typography.Text type="secondary">
                  {run.toolCalls} 次工具调用 · {(run.durationMs / 1000).toFixed(1)}s
                </Typography.Text>
              </Space>
              <Alert type={run.status === 'success' ? 'success' : 'warning'} message={run.result} style={{ marginBottom: 16 }} />
              <Timeline items={(run.steps || []).map(renderStep)} />
            </div>
          )}
        </Card>

        <Card title="最近运行" size="small" style={{ marginTop: 16 }}>
          <Table
            rowKey={(r) => r.at}
            size="small"
            dataSource={history}
            pagination={false}
            columns={[
              { title: '时间', dataIndex: 'at', width: 180, render: (v) => v?.replace('T', ' ').slice(0, 19) },
              { title: '发起人', dataIndex: 'by', width: 100 },
              { title: '任务', dataIndex: 'task', ellipsis: true },
              { title: '状态', dataIndex: 'status', width: 100, render: statusTag },
              { title: '调用', dataIndex: 'toolCalls', width: 60 },
            ]}
            expandable={{
              expandedRowRender: (r) => <Timeline items={(r.steps || []).map(renderStep)} />,
            }}
            locale={{ emptyText: <Empty description="还没有运行记录" /> }}
          />
        </Card>
      </Col>

      <Col span={8}>
        <Card title={<Space><ToolOutlined />可用工具</Space>} size="small">
          <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
            工具是"数据集合 → agent-tools"里的注册行,加一行即多一个能力,基座零代码变更。
          </Typography.Paragraph>
          {tools.length === 0 && !toolsErr && <Empty description="注册表为空" />}
          <Collapse
            ghost
            size="small"
            items={tools.map((t) => ({
              key: t.name,
              label: <Typography.Text code>{t.name}</Typography.Text>,
              children: (
                <div style={{ fontSize: 13 }}>
                  <div>{t.description}</div>
                  {(t.params || []).length > 0 && (
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                      {t.params.map((p) => (
                        <li key={p.key}>
                          <Typography.Text code>{p.key}</Typography.Text> {p.type}{p.required ? '(必填)' : ''} — {p.description}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ),
            }))}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default AgentConsole;

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge, Button, Card, Col, Empty, Form, Input, Modal, Popconfirm, Row, Select, Space,
  Statistic, Switch, Table, Tag, Tooltip, Typography, message,
} from 'antd';
import { CloudServerOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { serviceOpsApi } from '../../apis/serviceOps';

/**
 * 服务状态面板:目录登记(唯一接入面) + 探测结果(api 侧 15s 一轮,内存态)
 * + 事件流(outbox 最近 N 条)。
 * 登记走 /system/services(有 URL/联动校验并发审计事件),不再推荐去数据集合页裸改。
 * 10s 轮询而不是 websocket:运维速览页,实时性要求就到这,别为它建长连接。
 */
const POLL_MS = 10_000;

/**
 * 信任级别与能力授权。与后端 service-trust.constants.ts 对应——
 * 后端会按白名单校验 grants,这里的选项漏了某项只是界面上选不到,不会静默写坏数据。
 */
const TRUST_LEVEL_OPTIONS = [
  { value: 'first-party', label: '一方(内部团队/同一部署)' },
  { value: 'second-party', label: '二方(内部独立团队)' },
  { value: 'third-party', label: '三方(外包/外部供应商)' },
];

const GRANT_OPTIONS = [
  'user-profile:read-basic',
  'user-profile:read-full',
  'points:grant',
  'oss:upload',
  'shortlink:create',
].map((v) => ({ value: v, label: v }));

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

/** 目录登记表单(新建/编辑共用)。embedUrl 变更要二次确认——它决定 token 发给谁 */
const RegistryModal = ({ open, initial, registry, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.key);
  // 只有顶层记录能当父(菜单两层封顶),且不能选自己
  const all = registry || [];
  const childKeys = all.filter((r) => r.parentKey === initial?.key).map((r) => r.key);
  const hasChildren = isEdit && childKeys.length > 0;
  const parentOptions = all
    .filter((r) => r.key !== initial?.key && !r.parentKey)
    .map((r) => ({ value: r.key, label: `${r.menuTitle || r.name} (${r.key})` }));

  useEffect(() => {
    // 新建默认一方:存量与内部服务都是这个级别。三方必须手动改,
    // 免得漏改导致外部供应商拿到一方的默认授权集
    if (open) form.setFieldsValue(initial || { enabled: true, entryType: 'none', trustLevel: 'first-party' });
  }, [open, initial, form]);

  const submit = async () => {
    const values = await form.validateFields();
    const doSave = async () => {
      setSaving(true);
      const res = isEdit
        ? await serviceOpsApi.update(initial.key, values)
        : await serviceOpsApi.register(values);
      setSaving(false);
      if (res.success) { message.success(isEdit ? '已更新' : '已登记'); onSaved(); }
      else message.error(res.msg || '保存失败');
    };
    // embedUrl 新增或变更 = 决定握手 token 发给哪个 origin,提示确认
    if (values.entryType === 'embed' && values.embedUrl && values.embedUrl !== initial?.embedUrl) {
      Modal.confirm({
        title: '确认嵌入地址',
        content: `基座将向 ${new URL(values.embedUrl).origin} 下发登录 token,请确认该地址可信`,
        okText: '确认登记',
        onOk: doSave,
      });
    } else {
      await doSave();
    }
  };

  return (
    <Modal
      title={isEdit ? `编辑:${initial.key}` : '登记服务'}
      open={open}
      onOk={submit}
      okText="保存"
      confirmLoading={saving}
      onCancel={onClose}
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical" size="small">
        {!isEdit && (
          <Form.Item name="key" label="key(小写 slug,即 /embed/:key)" rules={[
            { required: true, pattern: /^[a-z][a-z0-9-]{0,49}$/, message: '小写字母开头的 slug' },
          ]}>
            <Input placeholder="如 demo-activity" />
          </Form.Item>
        )}
        <Space.Compact block>
          <Form.Item name="name" label="服务名" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Input placeholder="给人看的名字" />
          </Form.Item>
          <Form.Item name="baseUrl" label="API 根(可含路径前缀)" rules={[{ required: true }]} style={{ flex: 2, marginLeft: 8 }}>
            <Input placeholder="如 http://localhost:8084/api" />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block>
          <Form.Item name="healthPath" label="健康检查路径" style={{ flex: 1 }}>
            <Input placeholder="默认 /health" />
          </Form.Item>
          <Form.Item name="metricsPath" label="指标路径" style={{ flex: 1, marginLeft: 8 }}>
            <Input placeholder="如 /metrics-lite,可空" />
          </Form.Item>
          <Form.Item name="toolsPath" label="Agent 工具端点" style={{ flex: 1, marginLeft: 8 }}>
            <Input placeholder="如 /system/agent/tools,可空" />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block>
          <Form.Item name="entryType" label="入口形态" style={{ width: 170 }}>
            <Select options={[
              { value: 'none', label: '无入口' },
              { value: 'embed', label: 'iframe 嵌入(管理端)' },
              { value: 'zone', label: 'zone 路径分区(C端)' },
            ]} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.entryType !== c.entryType}>
            {({ getFieldValue }) => getFieldValue('entryType') === 'embed' && (
              <Form.Item name="embedUrl" label="嵌入地址" rules={[{ required: true }]} style={{ flex: 1, marginLeft: 8 }}>
                <Input placeholder="子应用页面地址,基座向其 origin 下发 token" />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.entryType !== c.entryType}>
            {({ getFieldValue }) => getFieldValue('entryType') === 'zone' && (
              <Form.Item name="pathPrefix" label="URL 前缀(生效需重启 C 端主应用)" rules={[
                { required: true, pattern: /^\/[a-z][a-z0-9-]{0,49}$/, message: '单段小写路径,如 /activity' },
              ]} style={{ flex: 1, marginLeft: 8 }}>
                <Input placeholder="如 /activity,全域唯一" />
              </Form.Item>
            )}
          </Form.Item>
        </Space.Compact>
        <Space.Compact block>
          <Form.Item name="menuTitle" label="菜单标题" style={{ flex: 1 }}>
            <Input placeholder="缺省用服务名" />
          </Form.Item>
          <Form.Item name="menuIcon" label="菜单图标" style={{ flex: 1, marginLeft: 8 }}>
            <Input placeholder="antd 图标名,如 AppstoreOutlined" />
          </Form.Item>
          <Form.Item name="permCode" label="权限码" style={{ flex: 1, marginLeft: 8 }}
            extra="需在权限管理为角色分配后生效;空=仅 ServiceOps 可见">
            <Input placeholder="如 DemoActivity" />
          </Form.Item>
        </Space.Compact>
        <Space.Compact block>
          <Form.Item name="trustLevel" label="信任级别" style={{ width: 200 }}
            extra="代码提供方的可信程度,不是业务重要性">
            <Select options={TRUST_LEVEL_OPTIONS} />
          </Form.Item>
          <Form.Item name="grants" label="能力授权(grants)" style={{ flex: 1, marginLeft: 8 }}
            extra="该服务能访问哪些平台能力。与用户权限码是两套体系,服务的能力不能靠转发高权限用户 token 获得">
            <Select mode="multiple" allowClear placeholder="三方服务默认为空,每项能力都要显式授予"
              options={GRANT_OPTIONS} />
          </Form.Item>
        </Space.Compact>
        <Form.Item noStyle shouldUpdate={(p, c) => p.entryType !== c.entryType}>
          {({ getFieldValue }) => getFieldValue('entryType') === 'embed' && (
            <Form.Item name="parentKey" label="归到哪个菜单下"
              extra={hasChildren
                ? `${initial.key} 自己已有子菜单(${childKeys.join(', ')}),菜单只支持两层,不能再归到别人下面`
                : '空=顶层菜单。选一个后本条会变成它的子菜单;父节点可以是没有嵌入地址的纯分组条目'}>
              <Select allowClear disabled={hasChildren} placeholder="空 = 顶层菜单"
                options={parentOptions} />
            </Form.Item>
          )}
        </Form.Item>
        <Form.Item name="enabled" label="启用(探测/入口/工具总开关)" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ServiceOps = () => {
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null=关 {}=新建 {key..}=编辑
  const timer = useRef(null);

  const load = useCallback(async () => {
    const [s, e, r] = await Promise.all([
      serviceOpsApi.status(), serviceOpsApi.events(30), serviceOpsApi.list(),
    ]);
    if (s.success) setServices(s.data || []);
    if (e.success) setEvents(e.data || []);
    if (r.success) setRegistry(r.data || []);
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

      <Card
        title="服务登记(目录)"
        size="small"
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setEditing({})}>
            登记服务
          </Button>
        }
      >
        <Table
          rowKey="key"
          size="small"
          dataSource={registry}
          pagination={false}
          columns={[
            { title: 'key', dataIndex: 'key', width: 130, render: (v) => <Typography.Text code>{v}</Typography.Text> },
            { title: '服务名', dataIndex: 'name', width: 180, ellipsis: true },
            { title: 'API 根', dataIndex: 'baseUrl', width: 220, ellipsis: true },
            {
              title: '入口', dataIndex: 'entryType', width: 160,
              render: (v, row) => {
                // 标出归组关系:不显示的话,一条 embed 条目为什么没出现在顶层菜单里
                // 只能靠去数据库看 parent_key
                if (v === 'embed') return (
                  <Space size={4}>
                    <Tooltip title={row.embedUrl}><Tag color="blue">embed</Tag></Tooltip>
                    {row.parentKey && <Tooltip title={`归在 ${row.parentKey} 之下`}><Tag color="cyan">↳{row.parentKey}</Tag></Tooltip>}
                  </Space>
                );
                if (v === 'zone') return <Tooltip title={row.baseUrl}><Tag color="orange">zone {row.pathPrefix}</Tag></Tooltip>;
                return <Typography.Text type="secondary">-</Typography.Text>;
              },
            },
            { title: '权限码', dataIndex: 'permCode', width: 130, render: (v) => (v ? <Typography.Text code>{v}</Typography.Text> : '-') },
            {
              // 三方标红:一眼能看出哪些服务是外部提供方,巡检时这是最该被注意的一列
              title: '信任', dataIndex: 'trustLevel', width: 90,
              render: (v) => {
                const level = v || 'first-party';
                const color = level === 'third-party' ? 'red' : level === 'second-party' ? 'orange' : 'blue';
                return <Tag color={color}>{level.replace('-party', '方')}</Tag>;
              },
            },
            {
              title: '授权', dataIndex: 'grants', width: 80,
              render: (v) => {
                const n = Array.isArray(v) ? v.length : 0;
                return n ? <Tooltip title={v.join('\n')}><Tag>{n} 项</Tag></Tooltip> : <Tag color="default">无</Tag>;
              },
            },
            { title: '工具', dataIndex: 'toolsPath', width: 70, render: (v) => (v ? <Tag color="purple">有</Tag> : '-') },
            { title: '启用', dataIndex: 'enabled', width: 60, render: (v) => <Badge status={v === false ? 'default' : 'success'} /> },
            {
              title: '操作', width: 120,
              render: (_, row) => (
                <Space>
                  <Button size="small" onClick={() => setEditing(row)}>编辑</Button>
                  <Popconfirm title={`下线 ${row.key}?探测/入口/工具一并移除`} onConfirm={async () => {
                    const res = await serviceOpsApi.remove(row.key);
                    if (res.success) { message.success('已下线'); load(); }
                  }}>
                    <Button size="small" danger>下线</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          locale={{ emptyText: <Empty description="目录为空" /> }}
        />
      </Card>

      <RegistryModal
        open={!!editing}
        initial={editing}
        registry={registry}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
      />

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

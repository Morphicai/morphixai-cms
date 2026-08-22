import { useCallback, useEffect, useState } from 'react';
import {
  Button, Card, Col, Drawer, Input, Modal, Popconfirm, Row, Space, Switch, Table, Tag, Typography, message,
} from 'antd';
import { PlusOutlined, RobotOutlined, LinkOutlined } from '@ant-design/icons';
import { formApi } from '../../apis/form';
import SchemaFormRenderer from './components/SchemaFormRenderer';

/**
 * 表单管理：列表 + 编辑器(JSON + 实时预览 + 智能生成) + 数据查看。
 * 编辑器这版就是 JSON 文本框——拖拽设计器是下一迭代的事,
 * 智能生成 + 预览已经把手写成本压得很低,先把链路跑真。
 */
const DEFAULT_SCHEMA = JSON.stringify(
  { title: '未命名表单', fields: [{ key: 'name', label: '姓名', type: 'text', required: true }] },
  null, 2,
);

const FormManagement = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  // 编辑器状态
  const [editing, setEditing] = useState(null); // null=关闭 {}=新建 {id..}=编辑
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [schemaText, setSchemaText] = useState(DEFAULT_SCHEMA);
  const [aiDesc, setAiDesc] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  // 数据抽屉
  const [entriesOf, setEntriesOf] = useState(null);
  const [entries, setEntries] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await formApi.list();
    if (res.success) setList(res.data.list || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const parsedSchema = (() => {
    try { return JSON.parse(schemaText); } catch { return null; }
  })();

  const openCreate = () => { setEditing({}); setName(''); setSlug(''); setSchemaText(DEFAULT_SCHEMA); setAiDesc(''); };
  const openEdit = (row) => {
    setEditing(row); setName(row.name); setSlug(row.slug);
    setSchemaText(JSON.stringify(row.schemaJson, null, 2)); setAiDesc('');
  };

  const handleGenerate = async () => {
    if (!aiDesc.trim()) { message.warning('先描述一下要什么表单'); return; }
    setGenerating(true);
    const res = await formApi.generate(aiDesc.trim());
    setGenerating(false);
    if (res.success && res.data?.schema) {
      setSchemaText(JSON.stringify(res.data.schema, null, 2));
      message.success('草稿已生成，确认无误再保存');
    } else {
      message.error(res.msg || '生成失败');
    }
  };

  const handleSave = async () => {
    if (!parsedSchema) { message.error('schema 不是合法 JSON'); return; }
    if (!name.trim()) { message.error('表单名称不能为空'); return; }
    setSaving(true);
    const res = editing?.id
      ? await formApi.update(editing.id, { name: name.trim(), schemaJson: parsedSchema })
      : await formApi.create({ name: name.trim(), slug: slug.trim(), schemaJson: parsedSchema });
    setSaving(false);
    if (res.success) { message.success('已保存'); setEditing(null); load(); }
    else message.error(res.msg || '保存失败');
  };

  const toggleEnabled = async (row, checked) => {
    const res = await formApi.update(row.id, { enabled: checked ? 1 : 0 });
    if (res.success) { message.success(checked ? '已启用' : '已停用'); load(); }
  };

  const openEntries = async (row) => {
    setEntriesOf(row);
    const res = await formApi.entries(row.id, 1, 50);
    setEntries(res.success ? res.data.list || [] : []);
  };

  const fillUrl = (row) => `${window.location.origin}/#/f/${row.slug}`;

  const columns = [
    { title: '名称', dataIndex: 'name' },
    { title: 'slug', dataIndex: 'slug', render: (v) => <Typography.Text code>{v}</Typography.Text> },
    { title: '版本', dataIndex: 'schemaVersion', width: 70, render: (v) => `v${v}` },
    {
      title: '启用', dataIndex: 'enabled', width: 90,
      render: (v, row) => <Switch checked={!!v} onChange={(c) => toggleEnabled(row, c)} />,
    },
    {
      title: '操作', width: 300,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>编辑</Button>
          <Button size="small" onClick={() => openEntries(row)}>数据</Button>
          <Button size="small" icon={<LinkOutlined />} disabled={!row.enabled}
            onClick={() => { navigator.clipboard.writeText(fillUrl(row)); message.success('填报链接已复制'); }}>
            链接
          </Button>
          <Popconfirm title="删除表单及其全部数据？" onConfirm={async () => {
            const res = await formApi.remove(row.id);
            if (res.success) { message.success('已删除'); load(); }
          }}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="表单管理"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建表单</Button>}
    >
      <Table rowKey="id" loading={loading} dataSource={list} columns={columns} pagination={false} />

      {/* 编辑器：左 JSON 右预览 */}
      <Modal
        title={editing?.id ? `编辑：${editing.name}` : '新建表单'}
        open={!!editing}
        onOk={handleSave}
        okText="保存"
        confirmLoading={saving}
        onCancel={() => setEditing(null)}
        width={980}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space.Compact style={{ width: '100%' }}>
            <Input addonBefore="名称" value={name} onChange={(e) => setName(e.target.value)} />
            <Input addonBefore="slug" value={slug} disabled={!!editing?.id}
              onChange={(e) => setSlug(e.target.value)} placeholder="小写字母/数字/短横线" />
          </Space.Compact>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              prefix={<RobotOutlined />}
              placeholder="描述你要的表单，例如：讲座报名表，收集姓名、邮箱、参加人数(1-3)…"
              value={aiDesc}
              onChange={(e) => setAiDesc(e.target.value)}
              onPressEnter={handleGenerate}
            />
            <Button loading={generating} onClick={handleGenerate}>智能生成</Button>
          </Space.Compact>
          <Row gutter={16}>
            <Col span={12}>
              <Input.TextArea
                rows={18}
                value={schemaText}
                onChange={(e) => setSchemaText(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
              {!parsedSchema && <Tag color="red" style={{ marginTop: 8 }}>JSON 语法错误</Tag>}
            </Col>
            <Col span={12} style={{ maxHeight: 430, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
              {parsedSchema
                ? <SchemaFormRenderer schema={parsedSchema} />
                : <Typography.Text type="secondary">JSON 合法后这里实时预览</Typography.Text>}
            </Col>
          </Row>
        </Space>
      </Modal>

      {/* 数据抽屉 */}
      <Drawer
        title={entriesOf ? `${entriesOf.name} · 提交数据` : ''}
        open={!!entriesOf}
        onClose={() => setEntriesOf(null)}
        width={720}
      >
        <Table
          rowKey="id"
          dataSource={entries}
          pagination={false}
          columns={[
            { title: '时间', dataIndex: 'createDate', width: 180, render: (v) => new Date(v).toLocaleString() },
            { title: '版本', dataIndex: 'schemaVersion', width: 70, render: (v) => <Tag>v{v}</Tag> },
            { title: '数据', dataIndex: 'dataJson', render: (v) => <Typography.Text code style={{ fontSize: 12 }}>{JSON.stringify(v)}</Typography.Text> },
          ]}
        />
      </Drawer>
    </Card>
  );
};

export default FormManagement;

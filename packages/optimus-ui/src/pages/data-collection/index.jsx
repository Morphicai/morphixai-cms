import { useCallback, useEffect, useState } from 'react';
import {
  Button, Card, Col, Drawer, Input, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography, message,
} from 'antd';
import { PlusOutlined, RobotOutlined } from '@ant-design/icons';
import { dataCollectionApi } from '../../apis/dataCollection';
import { formApi } from '../../apis/form';
import SchemaFormRenderer from '../form/components/SchemaFormRenderer';

/**
 * 数据集合：一份 entity schema 驱动增删改查。
 * 底座是字典模块(集合+行),schema 协议与校验器和动态表单同一套,
 * 行编辑用的也是同一个 SchemaFormRenderer——三个已验收资产的拼装,
 * 这个页面只负责接线,不发明新概念。
 * schema 编辑沿用表单管理页的取舍:JSON + 实时预览 + 智能生成,不做拖拽设计器。
 */
const DEFAULT_SCHEMA = JSON.stringify(
  { title: '未命名集合', fields: [{ key: 'name', label: '名称', type: 'text', required: true }] },
  null, 2,
);

const ACCESS_OPTIONS = [
  { value: 'private', label: 'private(仅管理端)' },
  { value: 'public_read', label: 'public_read(C端可读)' },
  { value: 'public_write', label: 'public_write(C端可读写)' },
];

// 行 key 是字典的历史包袱,数据集合场景用户不感知——生成个短随机串当内部 rowId
const genRowKey = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const DataCollectionManagement = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  // 集合编辑器
  const [editing, setEditing] = useState(null); // null=关闭 {}=新建 {id..}=编辑
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accessType, setAccessType] = useState('private');
  const [schemaText, setSchemaText] = useState(DEFAULT_SCHEMA);
  const [aiDesc, setAiDesc] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  // 行数据抽屉
  const [rowsOf, setRowsOf] = useState(null); // 当前集合
  const [rows, setRows] = useState([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  // 行编辑 Modal
  const [rowEditing, setRowEditing] = useState(null); // null=关闭 {}=新建 {id..}=编辑
  const [rowSaving, setRowSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await dataCollectionApi.listCollections();
    if (res.success) setList(res.data.list || res.data.items || res.data || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const parsedSchema = (() => {
    try { return JSON.parse(schemaText); } catch { return null; }
  })();

  const openCreate = () => {
    setEditing({}); setName(''); setDisplayName(''); setAccessType('private');
    setSchemaText(DEFAULT_SCHEMA); setAiDesc('');
  };
  const openEdit = (row) => {
    setEditing(row); setName(row.name); setDisplayName(row.displayName || '');
    setAccessType(row.accessType || 'private');
    setSchemaText(row.schema ? JSON.stringify(row.schema, null, 2) : DEFAULT_SCHEMA);
    setAiDesc('');
  };

  // 智能生成直接复用表单的生成接口——schema 协议同源,建"数据模型"和建"表单"
  // 对模型来说是同一件事
  const handleGenerate = async () => {
    if (!aiDesc.trim()) { message.warning('先描述一下这个集合存什么数据'); return; }
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
    if (!editing?.id && !/^[a-z][a-z0-9-]{1,48}$/.test(name.trim())) {
      message.error('集合名需为小写字母开头的 slug(字母/数字/短横线)'); return;
    }
    if (!displayName.trim()) { message.error('显示名称不能为空'); return; }
    setSaving(true);
    const payload = { displayName: displayName.trim(), accessType, schema: parsedSchema, dataType: 'object' };
    const res = editing?.id
      ? await dataCollectionApi.updateCollection(editing.id, payload)
      : await dataCollectionApi.createCollection({ name: name.trim(), ...payload });
    setSaving(false);
    if (res.success) { message.success('已保存'); setEditing(null); load(); }
    else message.error(res.msg || '保存失败');
  };

  const loadRows = useCallback(async (collection) => {
    setRowsLoading(true);
    const res = await dataCollectionApi.listRows(collection.name, 1, 200);
    setRows(res.success ? res.data.list || res.data.items || [] : []);
    setRowsLoading(false);
  }, []);

  const openRows = (row) => {
    if (!Array.isArray(row.schema?.fields)) {
      message.warning('该集合未定义表单协议 schema,先编辑集合补上 schema');
      return;
    }
    setRowsOf(row);
    loadRows(row);
  };

  const handleRowSubmit = async (data) => {
    setRowSaving(true);
    const res = rowEditing?.id
      ? await dataCollectionApi.updateRow(rowEditing.id, data)
      : await dataCollectionApi.createRow(rowsOf.name, genRowKey(), data);
    setRowSaving(false);
    if (res.success) {
      message.success('已保存');
      setRowEditing(null);
      loadRows(rowsOf);
    } else {
      // 服务端 schema 校验的错误原样透出(缺必填/类型/unique 冲突)
      message.error(res.msg || '保存失败');
    }
  };

  const columns = [
    { title: '集合名', dataIndex: 'name', render: (v) => <Typography.Text code>{v}</Typography.Text> },
    { title: '显示名', dataIndex: 'displayName' },
    {
      title: '访问类型', dataIndex: 'accessType', width: 130,
      render: (v) => <Tag color={v === 'private' ? 'default' : v === 'public_read' ? 'blue' : 'orange'}>{v}</Tag>,
    },
    {
      title: 'schema', dataIndex: 'schema', width: 100,
      render: (v) => (Array.isArray(v?.fields) ? <Tag color="green">{v.fields.length} 字段</Tag> : <Tag>未定义</Tag>),
    },
    {
      title: '操作', width: 240,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>编辑</Button>
          <Button size="small" type="primary" ghost onClick={() => openRows(row)}>数据</Button>
          <Popconfirm title="删除集合？其下数据一并不可访问" onConfirm={async () => {
            const res = await dataCollectionApi.removeCollection(row.id);
            if (res.success) { message.success('已删除'); load(); }
          }}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 行表格的列由 schema 生成——这就是"schema 驱动"的读半边
  const schemaFields = Array.isArray(rowsOf?.schema?.fields) ? rowsOf.schema.fields : [];
  const rowColumns = [
    ...schemaFields.slice(0, 6).map((f) => ({
      title: f.label,
      dataIndex: ['value', f.key],
      ellipsis: true,
      render: (v) => {
        if (v === undefined || v === null || v === '') return <Typography.Text type="secondary">-</Typography.Text>;
        if (typeof v === 'boolean') return <Tag>{v ? '是' : '否'}</Tag>;
        if (Array.isArray(v)) return v.map((x) => <Tag key={x}>{x}</Tag>);
        return String(v);
      },
    })),
    {
      title: '操作', width: 140, fixed: 'right',
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => setRowEditing(row)}>编辑</Button>
          <Popconfirm title="删除该行？" onConfirm={async () => {
            const res = await dataCollectionApi.removeRow(row.id);
            if (res.success) { message.success('已删除'); loadRows(rowsOf); }
          }}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="数据集合"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建集合</Button>}
    >
      <Table rowKey="id" loading={loading} dataSource={list} columns={columns} pagination={false} />

      {/* 集合编辑器：左 JSON 右预览,与表单管理页同款 */}
      <Modal
        title={editing?.id ? `编辑集合：${editing.name}` : '新建集合'}
        open={!!editing}
        onOk={handleSave}
        okText="保存"
        confirmLoading={saving}
        onCancel={() => setEditing(null)}
        width={980}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space.Compact style={{ width: '100%' }}>
            <Input addonBefore="集合名" value={name} disabled={!!editing?.id}
              onChange={(e) => setName(e.target.value)} placeholder="小写 slug,建后不可改" />
            <Input addonBefore="显示名" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <Select value={accessType} onChange={setAccessType} options={ACCESS_OPTIONS} style={{ minWidth: 210 }} />
          </Space.Compact>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              prefix={<RobotOutlined />}
              placeholder="描述这个集合存什么，例如：渠道配置表，含渠道名、推广链接、负责人、是否启用…"
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
                : <Typography.Text type="secondary">JSON 合法后这里实时预览录入表单</Typography.Text>}
            </Col>
          </Row>
        </Space>
      </Modal>

      {/* 行数据抽屉 */}
      <Drawer
        title={rowsOf ? `${rowsOf.displayName || rowsOf.name} · 数据` : ''}
        open={!!rowsOf}
        onClose={() => { setRowsOf(null); setRows([]); }}
        width={860}
        extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setRowEditing({})}>新增一行</Button>}
      >
        <Table
          rowKey="id"
          size="small"
          loading={rowsLoading}
          dataSource={rows}
          columns={rowColumns}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Drawer>

      {/* 行编辑：与 C 端填报同一个渲染器。key 保证切换编辑对象时重挂载回填 */}
      <Modal
        title={rowEditing?.id ? '编辑数据' : '新增数据'}
        open={!!rowEditing}
        footer={null}
        onCancel={() => setRowEditing(null)}
        width={560}
        destroyOnClose
      >
        {rowsOf && rowEditing && (
          <SchemaFormRenderer
            key={rowEditing.id || 'new'}
            schema={rowsOf.schema}
            initialValues={rowEditing.value}
            submitting={rowSaving}
            submitText="保存"
            onSubmit={handleRowSubmit}
          />
        )}
      </Modal>
    </Card>
  );
};

export default DataCollectionManagement;

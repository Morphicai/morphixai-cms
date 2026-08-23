import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, Card, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message,
} from 'antd';
import { PlusOutlined, RobotOutlined, SearchOutlined } from '@ant-design/icons';
import { i18nApi } from '../../apis/i18n';

/**
 * 多语言管理:namespace + key → 各语言文案。
 * 列是动态的——translations 里出现什么 locale 就长什么列,默认三语起步。
 * "AI 补全"只填缺失的语言,已有译文(人工或上次 AI)不会被覆盖,后端保证。
 * 多语言能力只此一个入口(iframe 版"翻译管理"与本页功能撞车,已下线)。
 */
const BASE_LOCALES = ['zh-CN', 'en-US', 'ja-JP'];

const I18nManagement = () => {
  const [namespaces, setNamespaces] = useState([]);
  const [ns, setNs] = useState('');
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  // 编辑 Modal: null=关 {}=新建 {id..}=编辑
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ key: '', remark: '', translations: {} });
  const [saving, setSaving] = useState(false);

  const loadNamespaces = useCallback(async () => {
    const res = await i18nApi.namespaces();
    if (res.success) {
      setNamespaces(res.data || []);
      // 首进默认选第一个 namespace
      if (!ns && res.data?.length) setNs(res.data[0].namespace);
    }
  }, [ns]);
  useEffect(() => { loadNamespaces(); }, [loadNamespaces]);

  const load = useCallback(async (p = page) => {
    if (!ns) return;
    setLoading(true);
    const res = await i18nApi.entries(ns, p, 50, keyword || undefined);
    if (res.success) { setRows(res.data.list || []); setTotal(res.data.total || 0); }
    setLoading(false);
  }, [ns, keyword, page]);
  useEffect(() => { setPage(1); load(1); }, [ns]); // eslint-disable-line react-hooks/exhaustive-deps

  // 列 = 基础三语 ∪ 数据里实际出现过的 locale
  const locales = useMemo(() => {
    const seen = new Set(BASE_LOCALES);
    rows.forEach((r) => Object.keys(r.translations || {}).forEach((l) => seen.add(l)));
    return [...seen];
  }, [rows]);

  const openCreate = () => { setEditing({}); setForm({ key: '', remark: '', translations: {} }); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({ key: row.key, remark: row.remark || '', translations: { ...row.translations } });
  };

  const handleSave = async () => {
    if (!editing?.id && !form.key.trim()) { message.error('key 不能为空'); return; }
    // 去掉空串的 locale,别把 {"en-US":""} 存进去挡住回退
    const translations = {};
    for (const [l, t] of Object.entries(form.translations)) if (t?.trim()) translations[l] = t.trim();
    setSaving(true);
    const res = editing?.id
      ? await i18nApi.update(editing.id, { translations, remark: form.remark })
      : await i18nApi.create({ namespace: ns, key: form.key.trim(), translations, remark: form.remark });
    setSaving(false);
    if (res.success) { message.success('已保存'); setEditing(null); load(); loadNamespaces(); }
    else message.error(res.msg || '保存失败');
  };

  // 补全经 agent-service 完成(翻译只有 Agent 一条路径),同步等结果
  const handleTranslate = async () => {
    const targets = locales.filter((l) => l !== 'zh-CN');
    setTranslating(true);
    try {
      const res = await i18nApi.translate(ns, targets);
      const run = res.data?.data;
      if (run?.status === 'success') message.success(run.result || '补全完成');
      else message.warning(run?.result || '任务未完全完成,轨迹见智能助理页');
      load();
    } catch (e) {
      message.error(e?.response?.data?.msg || 'agent-service 未启动或执行失败');
    } finally {
      setTranslating(false);
    }
  };

  const columns = [
    {
      title: 'key', dataIndex: 'key', width: 220, fixed: 'left',
      render: (v) => <Typography.Text code copyable>{v}</Typography.Text>,
    },
    ...locales.map((l) => ({
      title: l, dataIndex: ['translations', l], ellipsis: true,
      render: (v) => (v ? v : <Tag color="orange">缺</Tag>),
    })),
    { title: '备注', dataIndex: 'remark', width: 160, ellipsis: true },
    {
      title: '操作', width: 130, fixed: 'right',
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>编辑</Button>
          <Popconfirm title="删除该键？" onConfirm={async () => {
            const res = await i18nApi.remove(row.id);
            if (res.success) { message.success('已删除'); load(); loadNamespaces(); }
          }}>
            <Button size="small" danger>删</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="多语言管理"
      extra={
        <Space>
          <Select
            style={{ minWidth: 180 }}
            placeholder="namespace"
            value={ns || undefined}
            onChange={setNs}
            options={namespaces.map((n) => ({ value: n.namespace, label: `${n.namespace} (${n.count})` }))}
            dropdownRender={(menu) => (
              <>
                {menu}
                <Space.Compact style={{ width: '100%', padding: 8 }}>
                  <Input
                    size="small" placeholder="新 namespace(小写slug)"
                    onPressEnter={(e) => {
                      const v = e.target.value.trim();
                      if (/^[a-z][a-z0-9-]{0,63}$/.test(v)) { setNs(v); }
                      else message.error('需为小写字母开头的 slug');
                    }}
                  />
                </Space.Compact>
              </>
            )}
          />
          <Input
            style={{ width: 200 }} prefix={<SearchOutlined />} placeholder="搜 key 或文案" allowClear
            value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={() => load(1)}
          />
          <Button icon={<RobotOutlined />} loading={translating} onClick={handleTranslate} disabled={!ns}>
            AI 补全缺失语言
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!ns}>新建键</Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={rows}
        columns={columns}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page, pageSize: 50, total, showTotal: (t) => `共 ${t} 键`,
          onChange: (p) => { setPage(p); load(p); },
        }}
      />

      <Modal
        title={editing?.id ? `编辑:${editing.key}` : `新建键(${ns})`}
        open={!!editing}
        onOk={handleSave}
        okText="保存"
        confirmLoading={saving}
        onCancel={() => setEditing(null)}
        width={640}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {!editing?.id && (
            <Input addonBefore="key" value={form.key} placeholder="如 hero.title"
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} />
          )}
          {locales.map((l) => (
            <div key={l}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{l}</Typography.Text>
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder={l === 'zh-CN' ? '源语言文案' : '留空可稍后用 AI 补全'}
                value={form.translations[l] || ''}
                onChange={(e) => setForm((f) => ({ ...f, translations: { ...f.translations, [l]: e.target.value } }))}
              />
            </div>
          ))}
          <Input addonBefore="备注" value={form.remark} placeholder="给译者/翻译模型的上下文,可空"
            onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} />
        </Space>
      </Modal>
    </Card>
  );
};

export default I18nManagement;

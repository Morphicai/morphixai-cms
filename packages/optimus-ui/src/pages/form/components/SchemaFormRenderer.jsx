import { Form, Input, InputNumber, Radio, Checkbox, DatePicker, Switch, Button } from 'antd';

/**
 * schema 驱动的表单渲染器——整个动态表单模块的核心资产。
 * 管理端预览和公开填报页用的是同一个我,预览即所得。
 * 只认协议里的 7 种类型,未知类型和 x- 扩展属性一律忽略(与服务端校验器同口径)。
 */
const SchemaFormRenderer = ({ schema, submitting = false, submitText = '提交', onSubmit }) => {
  const [form] = Form.useForm();
  const fields = Array.isArray(schema?.fields) ? schema.fields : [];

  const renderControl = (f) => {
    switch (f.type) {
      case 'text':
        return <Input placeholder={f.placeholder} maxLength={500} />;
      case 'textarea':
        return <Input.TextArea placeholder={f.placeholder} rows={4} maxLength={5000} />;
      case 'number':
        return <InputNumber placeholder={f.placeholder} min={f.min} max={f.max} style={{ width: '100%' }} />;
      case 'radio':
        return <Radio.Group options={(f.options || []).map((o) => ({ label: o, value: o }))} />;
      case 'checkbox':
        return <Checkbox.Group options={(f.options || []).map((o) => ({ label: o, value: o }))} />;
      case 'date':
        return <DatePicker style={{ width: '100%' }} />;
      case 'switch':
        return <Switch />;
      default:
        return null;
    }
  };

  const handleFinish = (values) => {
    // date 控件给的是 dayjs 对象,协议里日期是字符串;switch 未碰过是 undefined,补成 false
    const data = {};
    for (const f of fields) {
      let v = values[f.key];
      if (f.type === 'date' && v) v = v.format('YYYY-MM-DD');
      if (f.type === 'switch') v = !!v;
      if (v !== undefined && v !== null && v !== '') data[f.key] = v;
    }
    onSubmit?.(data);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} disabled={submitting}>
      {fields.map((f) =>
        renderControl(f) ? (
          <Form.Item
            key={f.key}
            name={f.key}
            label={f.label}
            valuePropName={f.type === 'switch' ? 'checked' : 'value'}
            rules={f.required ? [{ required: true, message: `请填写${f.label}` }] : []}
          >
            {renderControl(f)}
          </Form.Item>
        ) : null,
      )}
      {onSubmit && (
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            {submitText}
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default SchemaFormRenderer;

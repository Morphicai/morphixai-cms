import React from 'react';
import { Form, Input, Select, Button, Space, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

/**
 * 通用搜索组件
 * @param {Array} fields - 搜索字段配置
 * @param {Function} onSearch - 搜索回调
 * @param {Function} onReset - 重置回调
 * @param {String} layout - 表单布局
 */
const CommonSearch = ({
  fields = [],
  onSearch,
  onReset,
  layout = 'inline'
}) => {
  const [form] = Form.useForm();

  const handleSearch = () => {
    const values = form.getFieldsValue();
    // 过滤空值
    const filteredValues = Object.keys(values).reduce((acc, key) => {
      if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
        acc[key] = values[key];
      }
      return acc;
    }, {});
    onSearch?.(filteredValues);
  };

  const handleReset = () => {
    form.resetFields();
    onReset?.();
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'select':
        return (
          <Select
            placeholder={`请选择${field.label}`}
            options={field.options}
            allowClear
            style={{ width: field.width || 200 }}
          />
        );
      case 'date':
        return (
          <DatePicker
            placeholder={`请选择${field.label}`}
            style={{ width: field.width || 200 }}
          />
        );
      case 'dateRange':
        return (
          <DatePicker.RangePicker
            placeholder={[`开始${field.label}`, `结束${field.label}`]}
            style={{ width: field.width || 300 }}
          />
        );
      default:
        return (
          <Input
            placeholder={`请输入${field.label}`}
            style={{ width: field.width || 200 }}
          />
        );
    }
  };

  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#fafafa' }}>
      <Form form={form} layout={layout}>
        {fields.map(field => (
          <Form.Item
            key={field.key}
            name={field.key}
            label={field.label}
            style={{ marginBottom: layout === 'inline' ? 0 : 16 }}
          >
            {renderField(field)}
          </Form.Item>
        ))}
        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CommonSearch;
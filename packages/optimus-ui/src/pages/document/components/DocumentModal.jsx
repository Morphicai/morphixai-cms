import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, message } from 'antd';
import DocInput from './FormModal/createDocumentTypeFactory';
import JsonTree from '../../../shared/components/JsonTree';
import { TYPES } from '../config/documentTypes';
import 'react-quill/dist/quill.snow.css';

const { Option } = Select;

function createTypeValue(type) {
  return TYPES.find((item) => item.value === type) || TYPES[0];
}

/**
 * Document 编辑/创建弹窗
 * 使用标准的 Ant Design Modal 方式
 */
const DocumentModal = ({
  open,
  mode = 'create', // 'create' | 'edit'
  initialData = {},
  onOk,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [curType, setCurType] = useState(createTypeValue(initialData.type));
  const [jsonData, setJsonData] = useState(initialData.content || '');
  const isEdit = mode === 'edit';

  // 当弹窗打开或数据变化时，重置表单
  useEffect(() => {
    if (open) {
      const typeObj = createTypeValue(initialData.type);
      setCurType(typeObj);
      setJsonData(initialData.content || '');

      // 使用 setTimeout 确保表单完全初始化后再设置值
      setTimeout(() => {
        form.setFieldsValue({
          id: initialData.id,
          docKey: initialData.docKey || '',
          source: initialData.source || '',
          type: initialData.type || typeObj.value,
          content: initialData.content || '',
          description: initialData.description || '',
          showOnMenu: Boolean(initialData.showOnMenu),
        });
      }, 0);

      console.log('📝 Modal 打开 - 模式:', mode, '数据:', initialData, 'showOnMenu:', initialData.showOnMenu);
    }
  }, [open, initialData, mode, form]);

  // 处理类型变化
  const handleTypeChange = (value) => {
    const newType = createTypeValue(value);
    console.log('📝 类型切换:', value, '→', newType);
    setCurType(newType);
    // 切换类型时清空内容字段，确保输入框能正确更新
    form.setFieldsValue({ content: '' });
    setJsonData('');
  };

  // 处理内容变化
  const handleContentChange = (changedValues) => {
    if (changedValues.content !== undefined) {
      setJsonData(changedValues.content);
    }
  };

  // 处理提交
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('📝 提交表单:', values);

      setLoading(true);
      await onOk(values);

      // 成功后关闭弹窗并重置表单
      form.resetFields();
      setCurType(TYPES[0]);
      setJsonData('');
    } catch (error) {
      console.error('📝 表单验证失败:', error);
      // 如果是表单验证错误，不需要额外处理
      if (error.errorFields) {
        return;
      }
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setCurType(TYPES[0]);
    setJsonData('');
    onCancel();
  };

  return (
    <Modal
      title={isEdit ? '编辑文案中心' : '新建文案中心'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width="60vw"
      destroyOnClose={true}
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleContentChange}
      >
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          label="文档Key"
          name="docKey"
          rules={[
            { required: true, message: '请输入文档Key' },
            { min: 2, max: 40, message: '文档Key长度为2-40个字符' },
          ]}
        >
          <Input
            placeholder="请输入文档Key"
            disabled={isEdit}
          />
        </Form.Item>

        <Form.Item
          label="来源"
          name="source"
          rules={[
            { required: true, message: '请输入来源' },
            { min: 2, max: 40, message: '来源长度为2-40个字符' },
          ]}
        >
          <Input
            placeholder="请输入页面来源（如：home, contact等）"
            disabled={isEdit}
          />
        </Form.Item>

        <Form.Item
          label="类型"
          name="type"
          rules={[{ required: true, message: '请选择类型' }]}
        >
          <Select
            placeholder="请选择类型"
            onChange={handleTypeChange}
          >
            {TYPES.map(({ value, label }) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="描述"
          name="description"
          rules={[
            { required: true, message: '请输入描述' },
            { min: 2, max: 40, message: '描述长度为2-40个字符' },
          ]}
        >
          <Input placeholder="介绍当前文案中心的用途" />
        </Form.Item>

        <Form.Item
          label="菜单显示"
          name="showOnMenu"
          valuePropName="checked"
          tooltip="开启后，该文档将在左侧菜单的配置中心下显示，方便快速编辑"
        >
          <Switch 
            checkedChildren="显示" 
            unCheckedChildren="隐藏"
          />
        </Form.Item>

        <Form.Item
          label="内容"
          name="content"
          rules={[{ required: true, message: '请输入内容' }]}
        >
          <DocInput 
            type={curType} 
          />
        </Form.Item>

        {curType.value === 'json' && jsonData && (
          <Form.Item label="JSON预览">
            <JsonTree data={jsonData} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default DocumentModal;

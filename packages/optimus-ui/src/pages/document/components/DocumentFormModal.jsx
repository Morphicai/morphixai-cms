import { useEffect, useState } from 'react';
import { Modal, Form, Input, Switch, Select, message, Row, Col } from 'antd';
import DocInput from './FormModal/createDocumentTypeFactory';
import JsonTree from '../../../shared/components/JsonTree';
import { TYPES } from '../config/documentTypes';
import 'react-quill/dist/quill.snow.css';

function createTypeValue(type) {
  return TYPES.find((item) => item.value === type) || TYPES[0];
}

/**
 * 文案表单弹窗组件
 * 支持新建和编辑模式
 */
const DocumentFormModal = ({ open, mode, initialData, onOk, onCancel }) => {
  const [form] = Form.useForm();
  const [curType, setCurType] = useState(createTypeValue(initialData?.type));
  const [jsonData, setJsonData] = useState(initialData?.content || '');

  // 当弹窗打开或初始数据变化时，重置表单
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        const typeObj = createTypeValue(initialData.type);
        setCurType(typeObj);
        setJsonData(initialData.content || '');
        
        form.setFieldsValue({
          docKey: initialData.docKey,
          source: initialData.source,
          type: initialData.type || typeObj.value,
          description: initialData.description,
          content: initialData.content,
          isPublic: initialData.isPublic || false,
          showOnMenu: initialData.showOnMenu || false,
        });
      } else {
        const defaultType = createTypeValue('string');
        setCurType(defaultType);
        setJsonData('');
        form.resetFields();
        form.setFieldsValue({
          source: 'system',
          type: defaultType.value,
          isPublic: false,
          showOnMenu: false,
        });
      }
    }
  }, [open, mode, initialData, form]);

  // 处理提交
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 如果是编辑模式，添加 id
      if (mode === 'edit' && initialData) {
        values.id = initialData.id;
      }

      await onOk(values);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请检查表单填写是否正确');
    }
  };

  // 处理类型变化
  const handleTypeChange = (value) => {
    const newType = createTypeValue(value);
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

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setCurType(TYPES[0]);
    setJsonData('');
    onCancel();
  };

  return (
    <Modal
      title={mode === 'create' ? '新增文案' : '编辑文案'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleContentChange}
        initialValues={{
          source: 'system',
          type: 'string',
          isPublic: false,
          showOnMenu: false,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="文档标识"
              name="docKey"
              rules={[
                { required: true, message: '请输入文档标识' },
                { pattern: /^[a-zA-Z0-9_-]+$/, message: '只能包含字母、数字、下划线和横线' },
              ]}
              extra="唯一标识，用于系统内部引用"
            >
              <Input
                placeholder="例如: contact_phone, about_us"
                disabled={mode === 'edit'}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="来源"
              name="source"
              rules={[{ required: true, message: '请输入来源' }]}
              extra="标识文档来源，如: system, home, about"
            >
              <Input placeholder="例如: system, home, about" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="类型"
              name="type"
              rules={[{ required: true, message: '请选择类型' }]}
              extra="文档内容的数据类型"
            >
              <Select
                placeholder="请选择类型"
                onChange={handleTypeChange}
                options={TYPES.map(({ value, label }) => ({
                  label,
                  value,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="描述"
              name="description"
              rules={[{ required: true, message: '请输入描述' }]}
              extra="用于在菜单中显示的名称"
            >
              <Input placeholder="例如: 联系电话, 关于我们" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="内容"
          name="content"
          rules={[{ required: true, message: '请输入内容' }]}
        >
          <DocInput 
            key={curType.value} 
            type={curType} 
          />
        </Form.Item>

        {curType.value === 'json' && jsonData && (
          <Form.Item label="JSON预览">
            <JsonTree data={jsonData} />
          </Form.Item>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="是否公开"
              name="isPublic"
              valuePropName="checked"
              extra="公开后可通过公开接口访问"
            >
              <Switch checkedChildren="公开" unCheckedChildren="私有" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="在菜单中显示"
              name="showOnMenu"
              valuePropName="checked"
              extra="开启后将在配置中心菜单中显示"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default DocumentFormModal;

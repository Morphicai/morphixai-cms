import { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select } from 'antd';
import { useMount } from '../../../shared/hooks';
import CategoryService from '../../../services/CategoryService';

const { TextArea } = Input;

/**
 * 分类表单Modal组件
 */
const CategoryFormModal = ({ visible, mode, category, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // 加载分类列表（用于选择父分类）
  useMount(async () => {
    try {
      const response = await CategoryService.list({ tree: true });
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('加载分类列表失败:', error);
    }
  });

  // 当modal打开或category变化时，设置表单值
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && category) {
        form.setFieldsValue({
          name: category.name,
          code: category.code,
          description: category.description,
          sortWeight: category.sortWeight || 0,
          parentId: category.parentId,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, mode, category, form]);

  // 扁平化分类树（用于下拉选择）
  const flattenCategories = (cats, level = 0, excludeId = null) => {
    let result = [];
    cats.forEach((cat) => {
      // 编辑时排除自己和自己的子分类
      if (excludeId && cat.id === excludeId) {
        return;
      }
      result.push({
        label: '　'.repeat(level) + cat.name,
        value: cat.id,
      });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1, excludeId));
      }
    });
    return result;
  };

  const categoryOptions = flattenCategories(categories, 0, category?.id);

  // 处理提交
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const success = await onSubmit(values);
      if (success) {
        form.resetFields();
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={mode === 'create' ? '新建分类' : '编辑分类'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          sortWeight: 0,
        }}
      >
        <Form.Item
          label="分类名称"
          name="name"
          rules={[
            { required: true, message: '请输入分类名称' },
            { max: 50, message: '分类名称不能超过50个字符' },
          ]}
        >
          <Input placeholder="请输入分类名称" />
        </Form.Item>

        <Form.Item
          label="分类代码"
          name="code"
          rules={[
            { required: true, message: '请输入分类代码' },
            { pattern: /^[a-z0-9_-]+$/, message: '分类代码只能包含小写字母、数字、下划线和连字符' },
            { max: 50, message: '分类代码不能超过50个字符' },
          ]}
          extra="分类代码用于系统内部标识，只能包含小写字母、数字、下划线和连字符"
        >
          <Input placeholder="例如: news, activity" disabled={mode === 'edit'} />
        </Form.Item>

        <Form.Item
          label="父分类"
          name="parentId"
          extra="选择父分类可以创建多级分类结构"
        >
          <Select
            placeholder="请选择父分类（可选）"
            allowClear
            options={categoryOptions}
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="描述"
          name="description"
          rules={[
            { max: 200, message: '描述不能超过200个字符' },
          ]}
        >
          <TextArea
            placeholder="请输入分类描述"
            rows={3}
            showCount
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          label="排序权重"
          name="sortWeight"
          extra="数值越大，排序越靠前"
        >
          <InputNumber
            placeholder="请输入排序权重"
            min={0}
            max={9999}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryFormModal;

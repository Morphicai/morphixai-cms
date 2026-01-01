import React, { useEffect } from 'react';
import { Form, Input, InputNumber, TreeSelect, Button, Space, Card, Divider } from 'antd';
import PropTypes from 'prop-types';
import CoverConfigForm from './CoverConfigForm';

const { TextArea } = Input;

/**
 * 分类表单组件
 * 用于创建和编辑分类
 */
const CategoryForm = ({ 
  category, 
  categories, 
  mode = 'create', 
  onSubmit, 
  onCancel,
  loading = false 
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (category && mode === 'edit') {
      form.setFieldsValue({
        name: category.name,
        code: category.code,
        description: category.description,
        parentId: category.parentId,
        maxCoverImages: category.config?.maxCoverImages || 3,
        maxVersions: category.config?.maxVersions || 10,
        coverConfig: category.config?.coverConfig || {}
      });
    } else {
      form.resetFields();
    }
  }, [category, mode, form]);

  /**
   * 构建父分类树数据
   * 排除当前分类及其子分类
   */
  const buildParentTreeData = (items, excludeId = null) => {
    const filterAndMap = (nodes) => {
      return nodes
        .filter(node => node.id !== excludeId && !isDescendant(node, excludeId))
        .map(node => ({
          title: node.name,
          value: node.id,
          children: node.children && node.children.length > 0 
            ? filterAndMap(node.children) 
            : undefined
        }));
    };

    return filterAndMap(items);
  };

  /**
   * 检查节点是否是指定节点的后代
   */
  const isDescendant = (node, ancestorId) => {
    if (!ancestorId) return false;
    
    const checkChildren = (children) => {
      if (!children) return false;
      return children.some(child => {
        if (child.id === ancestorId) return true;
        return checkChildren(child.children);
      });
    };

    return checkChildren(node.children);
  };

  /**
   * 表单提交处理
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 构建提交数据
      const submitData = {
        name: values.name,
        code: values.code,
        description: values.description,
        parentId: values.parentId || null,
        config: {
          maxCoverImages: values.maxCoverImages,
          maxVersions: values.maxVersions,
          coverConfig: values.coverConfig || undefined
        }
      };

      onSubmit(submitData);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /**
   * 取消操作
   */
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const treeData = buildParentTreeData(
    categories, 
    mode === 'edit' ? category?.id : null
  );

  return (
    <Card 
      title={mode === 'create' ? '创建分类' : '编辑分类'}
      bordered={false}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          maxCoverImages: 3,
          maxVersions: 10
        }}
      >
        <Form.Item
          label="分类名称"
          name="name"
          rules={[
            { required: true, message: '请输入分类名称' },
            { max: 50, message: '分类名称不能超过50个字符' }
          ]}
        >
          <Input placeholder="请输入分类名称" />
        </Form.Item>

        <Form.Item
          label="分类代码"
          name="code"
          rules={[
            { required: true, message: '请输入分类代码' },
            { 
              pattern: /^[a-z0-9-_]+$/, 
              message: '分类代码只能包含小写字母、数字、连字符和下划线' 
            },
            { max: 50, message: '分类代码不能超过50个字符' }
          ]}
        >
          <Input 
            placeholder="请输入分类代码（如：news、product）" 
            disabled={mode === 'edit'}
          />
        </Form.Item>

        <Form.Item
          label="分类描述"
          name="description"
          rules={[
            { max: 200, message: '分类描述不能超过200个字符' }
          ]}
        >
          <TextArea 
            rows={3} 
            placeholder="请输入分类描述" 
          />
        </Form.Item>

        <Form.Item
          label="父分类"
          name="parentId"
        >
          <TreeSelect
            placeholder="请选择父分类（可选）"
            treeData={treeData}
            allowClear
            showSearch
            treeDefaultExpandAll
            treeNodeFilterProp="title"
          />
        </Form.Item>

        <Form.Item
          label="最大封面数量"
          name="maxCoverImages"
          rules={[
            { required: true, message: '请输入最大封面数量' },
            { type: 'number', min: 1, max: 10, message: '最大封面数量必须在1-10之间' }
          ]}
        >
          <InputNumber 
            min={1} 
            max={10} 
            style={{ width: '100%' }}
            placeholder="请输入最大封面数量（1-10）"
          />
        </Form.Item>

        <Form.Item
          label="最大版本数量"
          name="maxVersions"
          rules={[
            { required: true, message: '请输入最大版本数量' },
            { type: 'number', min: 1, max: 50, message: '最大版本数量必须在1-50之间' }
          ]}
        >
          <InputNumber 
            min={1} 
            max={50} 
            style={{ width: '100%' }}
            placeholder="请输入最大版本数量（1-50）"
          />
        </Form.Item>

        <Divider orientation="left">封面配置</Divider>

        <Form.Item
          label="封面分辨率限制"
          name="coverConfig"
          help="配置封面图片的分辨率要求，留空则不限制"
        >
          <CoverConfigForm />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              onClick={handleSubmit}
              loading={loading}
            >
              {mode === 'create' ? '创建' : '保存'}
            </Button>
            <Button onClick={handleCancel}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

CategoryForm.propTypes = {
  category: PropTypes.object,
  categories: PropTypes.array.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default CategoryForm;

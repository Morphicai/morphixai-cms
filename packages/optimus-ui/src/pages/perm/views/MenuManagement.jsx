import React, { useState, useRef } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Space, Modal, Form, Input, Select, InputNumber, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import menuService from '../../../services/MenuService';
import ActionButtons from '../../../components/common/ActionButtons';

const { Option } = Select;

// 菜单类型选项
const MENU_TYPES = [
  { label: '菜单', value: 1 },
  { label: 'TAB', value: 2 },
  { label: '按钮', value: 3 },
];

const MenuManagement = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [menuOptions, setMenuOptions] = useState([]);
  const actionRef = useRef();

  // 将扁平菜单数据转换为树形结构
  const buildMenuTree = (menus, parentId = '0') => {
    return menus
      .filter(menu => menu.parentId === parentId)
      .map(menu => ({
        ...menu,
        children: buildMenuTree(menus, menu.id.toString())
      }));
  };

  // 获取菜单选项（用于父级菜单选择）
  const getMenuOptions = (menus, level = 0) => {
    let options = [];
    menus.forEach(menu => {
      if (menu.type === 1) { // 只有菜单类型才能作为父级
        options.push({
          label: '　'.repeat(level) + menu.name,
          value: menu.id.toString(),
        });
        if (menu.children && menu.children.length > 0) {
          options = options.concat(getMenuOptions(menu.children, level + 1));
        }
      }
    });
    return options;
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: {
        1: { text: '菜单', status: 'Default' },
        2: { text: 'TAB', status: 'Processing' },
        3: { text: '按钮', status: 'Warning' },
      },
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 80,
      hideInSearch: true,
      render: (icon) => icon ? <i className={`anticon ${icon}`} /> : '-',
    },
    {
      title: '排序',
      dataIndex: 'orderNum',
      key: 'orderNum',
      width: 80,
      hideInSearch: true,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      hideInSearch: true,
      render: (code) => {
        if (typeof code === 'object') {
          return <pre style={{ fontSize: '12px', margin: 0 }}>{JSON.stringify(code, null, 2)}</pre>;
        }
        return code || '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      hideInSearch: true,
      render: (_, record) => (
        <ActionButtons
          record={record}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showView={false}
        />
      ),
    },
  ];

  // 获取菜单数据
  const fetchMenus = async (params) => {
    try {
      const response = await menuService.getAllMenus(true);
      if (response.success) {
        const treeData = buildMenuTree(response.data);
        setMenuOptions([
          { label: '根节点', value: '0' },
          ...getMenuOptions(treeData)
        ]);
        return {
          data: treeData,
          success: true,
          total: response.data.length,
        };
      }
      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error) {
      message.error('获取菜单数据失败');
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  // 处理编辑
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      parentId: record.parentId || '0',
      code: typeof record.code === 'object' ? JSON.stringify(record.code, null, 2) : record.code,
    });
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (record) => {
    try {
      const response = await menuService.delete(record.id);
      if (response.success) {
        message.success('删除成功');
        actionRef.current?.reload();
      } else {
        message.error(response.msg || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 处理新建
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ parentId: '0', type: 1, orderNum: 0 });
    setModalVisible(true);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 处理 code 字段
      let codeValue = values.code;
      if (codeValue) {
        try {
          codeValue = JSON.parse(codeValue);
        } catch (e) {
          // 如果不是有效的 JSON，保持原值
        }
      }

      const submitData = {
        ...values,
        code: codeValue,
        parentId: values.parentId === '0' ? null : values.parentId,
      };

      let response;
      if (editingRecord) {
        response = await menuService.update(editingRecord.id, submitData);
      } else {
        response = await menuService.create(submitData);
      }

      if (response.success) {
        message.success(editingRecord ? '更新成功' : '创建成功');
        setModalVisible(false);
        actionRef.current?.reload();
      } else {
        message.error(response.msg || '操作失败');
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('请检查表单输入');
      } else {
        message.error('操作失败');
      }
    }
  };

  return (
    <div>
      <ProTable
        columns={columns}
        request={fetchMenus}
        rowKey="id"
        actionRef={actionRef}
        search={{
          labelWidth: 'auto',
        }}
        pagination={false} // 树形结构不需要分页
        expandable={{
          defaultExpandAllRows: true,
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新建菜单
          </Button>,
        ]}
      />

      {/* 编辑/新建模态框 */}
      <Modal
        title={editingRecord ? '编辑菜单' : '新建菜单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入菜单名称' }]}
          >
            <Input placeholder="请输入菜单名称" />
          </Form.Item>

          <Form.Item
            name="parentId"
            label="父级菜单"
          >
            <Select placeholder="请选择父级菜单">
              {menuOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择菜单类型' }]}
          >
            <Select placeholder="请选择菜单类型">
              {MENU_TYPES.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="icon"
            label="图标"
          >
            <Input placeholder="请输入图标类名，如：anticon-user" />
          </Form.Item>

          <Form.Item
            name="orderNum"
            label="排序"
          >
            <InputNumber
              placeholder="请输入排序号"
              style={{ width: '100%' }}
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="Code (JSON格式)"
          >
            <Input.TextArea
              placeholder="请输入JSON格式的代码配置"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagement;
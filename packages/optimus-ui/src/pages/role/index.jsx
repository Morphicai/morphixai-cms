/**
 * 角色管理页面
 * 角色的创建、编辑、删除、权限分配等管理功能
 */

import { useState, useRef, useCallback } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Modal, Form, Input, Tag, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons';
import RoleService from '../../services/RoleService';
import PermissionModal from './components/PermissionModal';

const RoleManagement = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const actionRef = useRef();

  // 获取角色列表
  const fetchRoles = useCallback(async (params) => {
    const { current = 1, pageSize = 10, ...searchParams } = params;

    try {
      const result = await RoleService.list({
        page: current - 1,
        size: pageSize,
        ...searchParams,
      });

      return {
        data: result.data || [],
        success: result.success,
        total: result.total || 0,
      };
    } catch (error) {
      message.error('获取角色列表失败');
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  }, []);

  // 处理新增
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      remark: record.remark,
    });
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (record) => {
    try {
      const result = await RoleService.delete(record.id);
      if (result.success) {
        message.success('删除成功');
        actionRef.current?.reload();
      } else {
        message.error(result.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };



  // 处理权限分配
  const handlePermission = (record) => {
    setCurrentRole(record);
    setPermissionModalVisible(true);
  };

  // 处理权限分配完成
  const handlePermissionOk = () => {
    setPermissionModalVisible(false);
    setCurrentRole(null);
    // 可以选择是否刷新列表
    // actionRef.current?.reload();
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let result;
      if (editingRecord) {
        result = await RoleService.update(editingRecord.id, values);
      } else {
        // 新增角色时，默认不分配任何权限
        result = await RoleService.create({
          ...values,
          menuCodes: [] // 空权限，后续通过权限分配功能设置
        });
      }

      if (result.success) {
        message.success(`${editingRecord ? '更新' : '创建'}成功`);
        setModalVisible(false);
        actionRef.current?.reload();
      } else {
        message.error(result.message || `${editingRecord ? '更新' : '创建'}失败`);
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      ellipsis: true,
      formItemProps: {
        rules: [{ required: true, message: '请输入角色名称' }],
      },
    },

    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      search: false,
    },

    {
      title: '用户数量',
      dataIndex: 'userCount',
      width: 100,
      search: false,
      render: (count) => (
        <Tag color="blue">
          <TeamOutlined /> {count || 0}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      width: 180,
      search: false,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 260,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<SafetyOutlined />}
            onClick={() => handlePermission(record)}
          >
            权限
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个角色吗？"
            description="删除后不可恢复，请谨慎操作"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          <TeamOutlined style={{ marginRight: '8px' }} />
          角色管理
        </h1>
      </div> */}

      <ProTable
        headerTitle="角色列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增角色
          </Button>,
        ]}
        request={fetchRoles}
        columns={columns}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"

        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[
              { required: true, message: '请输入角色名称' },
              { max: 50, message: '角色名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>

          <Form.Item
            name="remark"
            label="角色备注"
            rules={[
              { max: 100, message: '角色备注不能超过100个字符' },
            ]}
          >
            <Input.TextArea
              placeholder="请输入角色备注"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限分配弹窗 */}
      <PermissionModal
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        onOk={handlePermissionOk}
        roleInfo={currentRole}
      />
    </div>
  );
};

export default RoleManagement;
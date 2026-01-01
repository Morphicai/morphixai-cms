import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ProTable } from '@ant-design/pro-table';
import { Button, Modal, Form, Input, Select, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ActionButtons from '../../../components/common/ActionButtons';
import UserService from '../../../services/UserService';
import RoleService from '../../../services/RoleService';
import { GlobalConsumer } from "../../../shared/contexts/useGlobalContext";

export default function UserPage() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [roles, setRoles] = useState([]);
  const actionRef = useRef();

  useEffect(() => {
  }, []);

  // 获取角色列表
  const fetchRoles = async () => {
    const result = await RoleService.list();
    if (result.success) {
      setRoles(result.data.map(role => ({
        label: role.name,
        value: role.id,
      })));
    }
  };

  // 获取用户列表
  const fetchUsers = useCallback(async (params) => {
    const { current = 1, pageSize = 10, ...searchParams } = params;
    const result = await UserService.list({
      page: current - 1,
      size: pageSize,
      ...searchParams,
    });

    return {
      data: result.data || [],
      success: result.success,
      total: result.total || 0,
    };
  }, []);

  // 处理编辑
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      roleIds: record.roles?.map(role => role.id) || [],
    });
    setModalVisible(true);
    fetchRoles();
  };

  // 处理删除
  const handleDelete = async (record) => {
    const result = await UserService.delete(record.id);
    if (result.success) {
      message.success('删除成功');
      actionRef.current?.reload();
    } else {
      message.error(result.error || '删除失败');
    }
  };

  // 处理新建
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
    fetchRoles();
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      let result;

      if (editingRecord) {
        result = await UserService.update(editingRecord.id, values);
      } else {
        result = await UserService.create(values);
      }

      if (result.success) {
        message.success(editingRecord ? '更新成功' : '创建成功');
        setModalVisible(false);
        actionRef.current?.reload();
      } else {
        message.error(result.error || '操作失败');
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
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
      title: '姓名',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 120,
    },
    {
      title: '账号',
      dataIndex: 'account',
      key: 'account',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      hideInSearch: true,
    },
    {
      title: '手机号',
      dataIndex: 'phoneNum',
      key: 'phoneNum',
      width: 120,
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        1: { text: '使用中', status: 'Success' },
        0: { text: '已禁用', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'green' : 'red'}>
          {record.status === 1 ? '使用中' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 200,
      hideInSearch: true,
      render: (roles) => (
        <div>
          {roles?.map(role => (
            <Tag key={role.id} color="blue">
              {role.name}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '最近登录时间',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
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

  return (
    <GlobalConsumer>
      {({ refresh }) => (
        <div>
          <ProTable
            columns={columns}
            request={(params, sorter, filter) => {
              return fetchUsers(params);
            }}
            rowKey="id"
            actionRef={actionRef}
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
                新建用户
              </Button>,
            ]}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
            }}
          />

          {/* 编辑/新建模态框 */}
          <Modal
            title={editingRecord ? '编辑用户' : '新建用户'}
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            onOk={handleSubmit}
            width={600}
            destroyOnClose
          >
            <Form form={form} layout="vertical">
              <Form.Item
                name="fullName"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>

              <Form.Item
                name="account"
                label="账号"
                rules={[{ required: true, message: '请输入账号' }]}
              >
                <Input
                  placeholder="请输入账号"
                  disabled={!!editingRecord}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入正确的邮箱格式' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>

              <Form.Item
                name="phoneNum"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3|4|5|7|8][0-9]\d{8}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input placeholder="请输入手机号" maxLength={11} />
              </Form.Item>

              {!editingRecord && (
                <>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password placeholder="请输入密码" />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="确认密码"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="请再次输入密码" />
                  </Form.Item>
                </>
              )}

              <Form.Item
                name="status"
                label="状态"
                initialValue={1}
              >
                <Select>
                  <Select.Option value={1}>使用中</Select.Option>
                  <Select.Option value={0}>已禁用</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="type"
                label="类型"
                initialValue={1}
              >
                <Select>
                  <Select.Option value={1}>普通用户</Select.Option>
                  <Select.Option value={0}>超级管理员</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="roleIds"
                label="关联角色"
              >
                <Select
                  mode="multiple"
                  placeholder="请选择角色"
                  options={roles}
                />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      )}
    </GlobalConsumer>
  );
}

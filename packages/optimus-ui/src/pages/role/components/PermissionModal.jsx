/**
 * 角色权限分配弹窗组件
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Tree, message, Spin, Alert, Button } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import RoleService from '../../../services/RoleService';
import { SYSTEM_ROUTES } from '../../../constants/routes';

// 将菜单数据转换为Tree组件需要的格式
const convertMenusToTreeData = (menus) => {
  return menus.map(menu => ({
    title: menu.name,
    key: menu.code, // 使用权限编码作为key
    children: menu.children ? convertMenusToTreeData(menu.children) : undefined
  }));
};



const PermissionModal = ({ open, onCancel, onOk, roleInfo }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [treeData, setTreeData] = useState([]);

  // 加载角色权限数据
  const loadRolePermissions = useCallback(async () => {
    if (!roleInfo?.id) return;

    setLoading(true);
    try {
      // 使用前端常量菜单数据（基于权限编码）
      const menuTreeData = convertMenusToTreeData(SYSTEM_ROUTES);
      setTreeData(menuTreeData);

      // 获取角色已有的权限
      const result = await RoleService.getRoleMenus(roleInfo.id);
      if (result.success) {
        // 后端返回的是权限编码数组
        const menuCodes = result.data || [];
        setCheckedKeys(menuCodes);
      } else {
        message.error('获取角色权限失败');
        // 设置空权限作为默认值
        setCheckedKeys([]);
      }
    } catch (error) {
      message.error('加载权限数据失败');
      console.error('加载权限数据失败:', error);
      // 设置空权限作为默认值
      setCheckedKeys([]);
    } finally {
      setLoading(false);
    }
  }, [roleInfo?.id]);

  // 处理权限保存
  const handleSave = async () => {
    setSaving(true);
    try {
      // 直接使用权限编码数组
      const result = await RoleService.updateRoleMenus(roleInfo.id, checkedKeys);
      
      if (result.success) {
        message.success('权限更新成功');
        onOk && onOk();
      } else {
        message.error(result.message || '权限更新失败');
      }
    } catch (error) {
      message.error('权限更新失败');
      console.error('权限更新失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 处理树节点选择
  const onCheck = (checkedKeysValue, info) => {
    setCheckedKeys(checkedKeysValue);
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    // 从当前树数据中提取所有ID
    const extractAllKeys = (nodes) => {
      let keys = [];
      nodes.forEach(node => {
        keys.push(node.key);
        if (node.children) {
          keys = keys.concat(extractAllKeys(node.children));
        }
      });
      return keys;
    };

    const allIds = extractAllKeys(treeData);
    if (checkedKeys.length === allIds.length) {
      setCheckedKeys([]);
    } else {
      setCheckedKeys(allIds);
    }
  };

  useEffect(() => {
    if (open && roleInfo) {
      loadRolePermissions();
    }
  }, [open, roleInfo, loadRolePermissions]);

  return (
    <Modal
      title={
        <div>
          <SafetyOutlined style={{ marginRight: 8 }} />
          权限分配 - {roleInfo?.name}
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      confirmLoading={saving}
      width={600}
      styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" tip="加载权限数据中..." />
        </div>
      ) : (
        <div>
          <Alert
            message="权限说明"
            description={
              <div>
                <p>• 选中的菜单项表示该角色可以访问对应的功能模块</p>
                <p>• 父菜单被选中时，子菜单会自动继承权限</p>
                <p>• 当前共有 {treeData.length > 0 ? treeData.reduce((count, node) => count + 1 + (node.children ? node.children.length : 0), 0) : 0} 个菜单项可分配</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="link" onClick={handleSelectAll} style={{ padding: 0 }}>
              全选/取消全选
            </Button>
            <span style={{ marginLeft: 16, opacity: 0.65 }}>
              已选择: {checkedKeys.length} 项
            </span>
          </div>

          <Tree
            checkable
            checkedKeys={checkedKeys}
            onCheck={onCheck}
            treeData={treeData}
            height={300}
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              padding: '8px'
            }}
          />

          <div style={{ marginTop: 16, opacity: 0.65, fontSize: '12px' }}>
            <p>提示：权限修改后，拥有该角色的用户需要重新登录才能生效</p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PermissionModal;
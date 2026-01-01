/**
 * 简化的权限API接口
 * 
 * 基于菜单级别的权限控制
 */

import { request } from "../shared/utils/axios";

/**
 * 获取用户权限编码列表
 * @returns {Promise<Array>} 权限编码数组
 */
export async function getUserPermissionCodes() {
  try {
    const response = await request({
      type: "get",
      url: "/perm/user/codes",
    });
    return response.data || [];
  } catch (error) {
    console.error('获取用户权限失败:', error);
    return [];
  }
}

/**
 * 批量验证权限
 * @param {Array} permissions 权限编码数组
 * @returns {Promise<Object>} 权限验证结果
 */
export async function verifyPermissions(permissions) {
  try {
    const response = await request({
      type: "post",
      url: "/perm/user/verify",
      data: { permissions }
    });
    return response.data || {};
  } catch (error) {
    console.error('权限验证失败:', error);
    return {};
  }
}

/**
 * 检查单个权限
 * @param {string} permission 权限编码
 * @returns {Promise<boolean>} 是否有权限
 */
export async function checkPermission(permission) {
  try {
    const response = await request({
      type: "get",
      url: `/perm/user/check/${permission}`,
    });
    return response.data === true;
  } catch (error) {
    console.error('权限检查失败:', error);
    return false;
  }
}

/**
 * 获取用户菜单权限（兼容性接口）
 * @returns {Promise<Array>} 菜单数据
 */
export async function getAllMenu() {
  console.warn('getAllMenu 接口已废弃，请使用 getUserPermissionCodes');
  try {
    const response = await request({
      type: "get",
      url: "/perm/menu",
    });
    return response;
  } catch (error) {
    console.error('获取菜单失败:', error);
    return { data: [] };
  }
}
/**
 * 测试用户数据（对应后端种子数据）
 */
export const TEST_USERS = {
  admin: {
    account: 'admin',
    password: 'admin',
    name: '超级管理员',
    expectedPermissions: [
      'sys:user:view',
      'sys:user:create',
      'sys:user:edit',
      'sys:user:delete',
      'sys:role:view',
      'sys:role:create',
      'sys:document:view',
      'sys:document:create',
    ],
  },

  operator: {
    account: 'operator',
    password: 'admin',
    name: '运营人员',
    expectedPermissions: [
      'sys:document:view',
      'sys:document:create',
      'sys:document:edit',
    ],
  },

  user: {
    account: 'user',
    password: 'admin',
    name: '普通用户',
    expectedPermissions: [
      'sys:dashboard:view',
    ],
  },
};

/**
 * 获取测试用户
 * @param {string} role - 用户角色 (admin, operator, user)
 * @returns {Object} 测试用户对象
 */
export function getTestUser(role = 'admin') {
  return TEST_USERS[role];
}

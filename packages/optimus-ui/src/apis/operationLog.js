import { request } from '../shared/utils/axios';

/**
 * 操作日志 API
 * 提供操作日志相关的 API 接口
 */

/**
 * 获取操作日志列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export async function getOperationLogList(params) {
  return await request({
    type: 'get',
    url: '/operation-log/list',
    data: params,
  });
}

/**
 * 获取操作日志详情
 * @param {number} id - 日志ID
 * @returns {Promise}
 */
export async function getOperationLogDetail(id) {
  return await request({
    type: 'get',
    url: `/operation-log/detail/${id}`,
  });
}

/**
 * 获取用户操作日志
 * @param {string} userId - 用户ID
 * @param {number} limit - 限制数量
 * @returns {Promise}
 */
export async function getUserOperationLogs(userId, limit) {
  return await request({
    type: 'get',
    url: `/operation-log/user/${userId}`,
    data: { limit },
  });
}

/**
 * 获取模块操作日志
 * @param {string} module - 模块名称
 * @param {number} limit - 限制数量
 * @returns {Promise}
 */
export async function getModuleOperationLogs(module, limit) {
  return await request({
    type: 'get',
    url: `/operation-log/module/${module}`,
    data: { limit },
  });
}

/**
 * 获取操作统计
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export async function getOperationStatistics(params) {
  return await request({
    type: 'get',
    url: '/operation-log/statistics',
    data: params,
  });
}

const operationLogApi = {
  getOperationLogList,
  getOperationLogDetail,
  getUserOperationLogs,
  getModuleOperationLogs,
  getOperationStatistics,
};

export default operationLogApi;

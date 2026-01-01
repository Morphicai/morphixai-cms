import { request } from '../shared/utils/axios';
import { handleApiError, isSuccess } from '../utils/errorHandler';

/**
 * 操作日志服务
 * 封装操作日志相关的 API 调用
 */
class OperationLogService {
  /**
   * 获取操作日志列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码（从1开始）
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.module - 模块筛选
   * @param {string} params.action - 操作筛选
   * @param {string} params.userId - 用户筛选
   * @param {string} params.status - 状态筛选
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {string} params.keyword - 关键词搜索
   * @param {string} params.sortBy - 排序字段
   * @param {string} params.sortOrder - 排序方向 (ASC/DESC)
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async list(params, options = {}) {
    const response = await request({
      type: 'get',
      url: '/operation-log/list',
      data: params,
      showTip: false,
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取操作日志列表失败' });
    }

    return response;
  }

  /**
   * 获取操作日志详情
   * @param {number} id - 日志ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getDetail(id, options = {}) {
    const response = await request({
      type: 'get',
      url: `/operation-log/detail/${id}`,
      showTip: false,
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取操作日志详情失败' });
    }

    return response;
  }

  /**
   * 获取用户操作日志
   * @param {string} userId - 用户ID
   * @param {number} limit - 限制数量
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getUserLogs(userId, limit = 10, options = {}) {
    const response = await request({
      type: 'get',
      url: `/operation-log/user/${userId}`,
      data: { limit },
      showTip: false,
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取用户操作日志失败' });
    }

    return response;
  }

  /**
   * 获取模块操作日志
   * @param {string} module - 模块名称
   * @param {number} limit - 限制数量
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getModuleLogs(module, limit = 10, options = {}) {
    const response = await request({
      type: 'get',
      url: `/operation-log/module/${module}`,
      data: { limit },
      showTip: false,
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取模块操作日志失败' });
    }

    return response;
  }

  /**
   * 获取操作统计
   * @param {Object} params - 查询参数
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getStatistics(params, options = {}) {
    const response = await request({
      type: 'get',
      url: '/operation-log/statistics',
      data: params,
      showTip: false,
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取操作统计失败' });
    }

    return response;
  }

  /**
   * 导出操作日志
   * @param {Object} params - 查询参数（与list方法相同）
   * @returns {Promise}
   */
  async exportLogs(params) {
    // 获取所有符合条件的日志（不分页）
    const response = await this.list(
      { ...params, pageSize: 10000 },
      { showError: false }
    );

    if (!isSuccess(response)) {
      return { success: false, error: '导出失败' };
    }

    return { success: true, data: response.data?.list || [] };
  }
}

const operationLogService = new OperationLogService();
export default operationLogService;

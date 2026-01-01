import { request } from '../shared/utils/axios';

/**
 * 外部任务服务（管理后台）
 * 封装外部任务审核相关的API调用
 */
class ExternalTaskService {
  /**
   * 获取提交记录列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} [params.status] - 状态筛选：PENDING/APPROVED/REJECTED
   * @param {string} [params.taskType] - 任务类型筛选
   * @param {string} [params.partnerId] - 合伙人ID筛选
   * @returns {Promise}
   */
  async getSubmissions(params) {
    const response = await request({
      type: 'get',
      url: '/admin/external-task/submissions',
      data: params
    });
    return response;
  }

  /**
   * 获取提交详情
   * @param {string} id - 提交记录ID
   * @returns {Promise}
   */
  async getSubmissionDetail(id) {
    const response = await request({
      type: 'get',
      url: `/admin/external-task/submissions/${id}`
    });
    return response;
  }

  /**
   * 审核通过
   * @param {string} id - 提交记录ID
   * @param {Object} data - 审核数据
   * @param {string} [data.reviewRemark] - 审核备注
   * @returns {Promise}
   */
  async approveSubmission(id, data = {}) {
    const response = await request({
      type: 'post',
      url: `/admin/external-task/submissions/${id}/approve`,
      data
    });
    return response;
  }

  /**
   * 审核拒绝
   * @param {string} id - 提交记录ID
   * @param {Object} data - 审核数据
   * @param {string} data.reviewRemark - 拒绝原因（必填）
   * @returns {Promise}
   */
  async rejectSubmission(id, data) {
    const response = await request({
      type: 'post',
      url: `/admin/external-task/submissions/${id}/reject`,
      data
    });
    return response;
  }

  /**
   * 获取审核统计
   * @returns {Promise}
   */
  async getStatistics() {
    const response = await request({
      type: 'get',
      url: '/admin/external-task/statistics'
    });
    return response;
  }
}

const externalTaskService = new ExternalTaskService();
export default externalTaskService;

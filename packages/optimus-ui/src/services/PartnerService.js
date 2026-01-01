import { request } from '../shared/utils/axios';
import { handleApiError, isSuccess } from '../utils/errorHandler';

/**
 * 合伙人服务
 * 封装合伙人相关的API调用
 */
class PartnerService {
  /**
   * 加入合伙人计划
   * @param {Object} data - 加入数据
   * @param {string} data.mode - 加入模式：'self' 或 'invite'
   * @param {string} [data.inviterCode] - 邀请人编号（invite模式必填）
   * @param {string} [data.channelCode] - 渠道码（可选）
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async joinPartner(data, options = {}) {
    const response = await request({
      type: 'post',
      url: '/biz/partner/join',
      data,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '加入合伙人计划失败' });
    }

    return response;
  }

  /**
   * 获取我的合伙人档案
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getProfile(options = {}) {
    const response = await request({
      type: 'get',
      url: '/biz/partner/profile',
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取合伙人档案失败' });
    }

    return response;
  }

  /**
   * 获取我的团队列表
   * @param {Object} params - 查询参数
   * @param {number} [params.level] - 层级：1 或 2
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getTeam(params, options = {}) {
    const response = await request({
      type: 'get',
      url: '/biz/partner/team',
      data: params,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取团队列表失败' });
    }

    return response;
  }

  /**
   * 获取我的团队概览
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getOverview(options = {}) {
    const response = await request({
      type: 'get',
      url: '/biz/partner/overview',
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取团队概览失败' });
    }

    return response;
  }

  /**
   * 创建推广渠道
   * @param {Object} data - 渠道数据
   * @param {string} data.name - 渠道名称
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async createChannel(data, options = {}) {
    const response = await request({
      type: 'post',
      url: '/biz/partner/channels',
      data,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '创建渠道失败' });
    }

    return response;
  }

  /**
   * 获取我的渠道列表
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async getChannels(options = {}) {
    const response = await request({
      type: 'get',
      url: '/biz/partner/channels',
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '获取渠道列表失败' });
    }

    return response;
  }

  /**
   * 禁用渠道
   * @param {number} channelId - 渠道ID
   * @param {Object} options - 错误处理选项
   * @returns {Promise}
   */
  async disableChannel(channelId, options = {}) {
    const response = await request({
      type: 'put',
      url: `/biz/partner/channels/${channelId}/disable`,
      showTip: false
    });

    if (!isSuccess(response) && options.showError !== false) {
      handleApiError(response, { defaultMessage: '禁用渠道失败' });
    }

    return response;
  }
}

const partnerService = new PartnerService();
export default partnerService;

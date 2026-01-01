import BaseService from './base/BaseService';
import { request } from '../shared/utils/axios';

/**
 * 奖励发放记录服务类
 */
class RewardClaimRecordService extends BaseService {
  constructor() {
    super('/biz/reward-claim-record');
  }

  /**
   * 获取奖励发放记录列表（管理员接口）
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async list(params = {}) {
    try {
      const { page = 1, pageSize = 10, uid, activityCode, activityType, status } = params;

      const response = await request({
        type: 'get',
        url: '/biz/reward-claim-record',
        data: {
          page,
          pageSize,
          uid,
          activityCode,
          activityType,
          status,
        },
      });

      if (response.code === 200 && response.data) {
        return {
          data: response.data.items || [],
          total: response.data.total || 0,
          success: true,
        };
      }

      return {
        data: [],
        total: 0,
        success: false,
        error: response.msg || '获取列表失败',
      };
    } catch (error) {
      console.error('获取奖励发放记录列表失败:', error);
      return {
        data: [],
        total: 0,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 删除奖励发放记录（管理员接口）
   * @param {string} id - 记录ID
   * @returns {Promise}
   */
  async delete(id) {
    try {
      const response = await request({
        type: 'delete',
        url: '/biz/reward-claim-record',
        data: { id },
      });

      if (response.code === 200) {
        return {
          success: true,
          message: response.msg || '删除成功',
        };
      }

      return {
        success: false,
        error: response.msg || '删除失败',
      };
    } catch (error) {
      console.error('删除奖励发放记录失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

const rewardClaimRecordService = new RewardClaimRecordService();
export default rewardClaimRecordService;


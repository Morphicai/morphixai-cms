import { request } from '../shared/utils/axios';

/**
 * 管理后台 - 合伙人管理 Service
 */
class AdminPartnerService {
  /**
   * 获取总览数据
   */
  async getDashboard() {
    const response = await request({
      type: 'get',
      url: '/biz/partner/admin/dashboard',
    });
    return response;
  }

  /**
   * 查询合伙人列表
   */
  async list(params) {
    const response = await request({
      type: 'get',
      url: '/biz/partner/admin/partners',
      data: params,
    });
    return response;
  }

  /**
   * 获取合伙人详情
   */
  async getDetail(partnerId) {
    const response = await request({
      type: 'get',
      url: `/biz/partner/admin/partners/${partnerId}`,
    });
    return response;
  }

  /**
   * 获取团队成员
   */
  async getTeam(partnerId, params) {
    const response = await request({
      type: 'get',
      url: `/biz/partner/admin/partners/${partnerId}/team`,
      data: params,
    });
    return response;
  }

  /**
   * 获取积分明细
   */
  async getPoints(partnerId, params) {
    const response = await request({
      type: 'get',
      url: `/biz/partner/admin/partners/${partnerId}/points`,
      data: params,
    });
    return response;
  }

  /**
   * 获取渠道列表
   */
  async getChannels(partnerId) {
    const response = await request({
      type: 'get',
      url: `/biz/partner/admin/partners/${partnerId}/channels`,
    });
    return response;
  }

  /**
   * 冻结合伙人
   */
  async freeze(partnerId, reason) {
    const response = await request({
      type: 'put',
      url: `/biz/partner/admin/partners/${partnerId}/freeze`,
      data: { reason },
    });
    return response;
  }

  /**
   * 解冻合伙人
   */
  async unfreeze(partnerId) {
    const response = await request({
      type: 'put',
      url: `/biz/partner/admin/partners/${partnerId}/unfreeze`,
    });
    return response;
  }

  /**
   * 纠正上级关系
   */
  async correctUplink(partnerId, newUplinkPartnerId) {
    const response = await request({
      type: 'post',
      url: `/biz/partner/admin/partners/${partnerId}/correct-uplink`,
      data: { newUplinkPartnerId },
    });
    return response;
  }

  /**
   * 更新备注
   */
  async updateRemark(partnerId, remark) {
    const response = await request({
      type: 'put',
      url: `/biz/partner/admin/partners/${partnerId}/remark`,
      data: { remark },
    });
    return response;
  }

  /**
   * 刷新积分缓存
   */
  async refreshCache() {
    const response = await request({
      type: 'post',
      url: '/biz/partner/admin/cache/refresh',
    });
    return response;
  }

  /**
   * 清空所有合伙人数据
   */
  async clearAllData(data) {
    const response = await request({
      type: 'delete',
      url: '/biz/partner/admin/partners/clear-all-data',
      data,
    });
    return response;
  }

  /**
   * 获取任务日志
   */
  async getTaskLogs(partnerId, page, pageSize) {
    const response = await request({
      type: 'get',
      url: `/biz/partner/admin/partners/${partnerId}/task-logs`,
      data: { page, pageSize },
    });
    return response;
  }

  /**
   * 分析邀请任务一致性
   */
  async analyzeInviteTasks(partnerId) {
    const response = await request({
      type: 'get',
      url: `/biz/partner/admin/partners/${partnerId}/analyze-invite-tasks`,
    });
    return response;
  }

  /**
   * 修复缺失的邀请任务
   */
  async fixInviteTasks(partnerId) {
    const response = await request({
      type: 'post',
      url: `/biz/partner/admin/partners/${partnerId}/fix-invite-tasks`,
    });
    return response;
  }
}

const adminPartnerService = new AdminPartnerService();
export default adminPartnerService;

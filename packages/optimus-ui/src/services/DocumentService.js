import BaseService from './base/BaseService';
import { request } from '../shared/utils/axios';

class DocumentService extends BaseService {
  constructor() {
    super('/document');
  }

  // 获取文档列表
  async list(params = {}) {
    console.log('🔍 DocumentService.list - 参数:', params);

    try {
      const response = await request({
        type: 'get',
        url: `${this.baseUrl}/list`,
        data: params,
      });

      // 确保返回的数据结构正确
      const responseData = response.data || {};
      const result = {
        data: Array.isArray(responseData.list) ? responseData.list : [],
        total: responseData.total || 0,
        success: response.success !== false,
      };

      console.log('✅ DocumentService - 返回:', result.data.length, '条数据，总计:', result.total);
      return result;
    } catch (error) {
      console.error('❌ 获取文档列表失败:', error);
      console.error('❌ 错误详情:', error.message);
      console.error('❌ 错误堆栈:', error.stack);
      return {
        data: [],
        total: 0,
        success: false,
      };
    }
  }

  // 创建文档
  async create(data) {
    try {
      const response = await request({
        type: 'post',
        url: `${this.baseUrl}`,
        data,
      });
      return response;
    } catch (error) {
      console.error('创建文档失败:', error);
      throw error;
    }
  }

  // 更新文档
  async update(data) {
    try {
      const response = await request({
        type: 'post',
        url: `${this.baseUrl}/update`,
        data,
      });
      return response;
    } catch (error) {
      console.error('更新文档失败:', error);
      throw error;
    }
  }

  // 根据ID更新文档
  async updateById(id, data) {
    try {
      const response = await request({
        type: 'post',
        url: `${this.baseUrl}/updateById/${id}`,
        data,
      });
      return response;
    } catch (error) {
      console.error('根据ID更新文档失败:', error);
      throw error;
    }
  }

  // 删除文档
  async delete(id) {
    try {
      const response = await request({
        type: 'delete', // 修改HTTP方法为DELETE
        url: `${this.baseUrl}/${id}`, // 修改为RESTful风格：DELETE /api/document/{id}
      });
      return response;
    } catch (error) {
      console.error('删除文档失败:', error);
      throw error;
    }
  }

  // 根据ID获取文档详情
  async getById(id) {
    try {
      const response = await request({
        type: 'post',
        url: `${this.baseUrl}/getResById/${id}`,
      });
      return response;
    } catch (error) {
      console.error('获取文档详情失败:', error);
      throw error;
    }
  }

  // 获取应用资源
  async getAppResource(data) {
    try {
      const response = await request({
        type: 'post',
        url: `${this.baseUrl}/getAppResource`,
        data,
      });
      return response;
    } catch (error) {
      console.error('获取应用资源失败:', error);
      throw error;
    }
  }

  // 获取最新应用资源
  async getAppLatestResource(data) {
    try {
      const response = await request({
        type: 'post',
        url: `${this.baseUrl}/getAppLatestResource`,
        data,
      });
      return response;
    } catch (error) {
      console.error('获取最新应用资源失败:', error);
      throw error;
    }
  }

  // 获取所有菜单文档
  async getAllMenuDocuments() {
    try {
      const response = await request({
        type: 'get',
        url: `${this.baseUrl}/getAllMenuDocuments`,
      });
      return response;
    } catch (error) {
      console.error('获取所有菜单文档失败:', error);
      throw error;
    }
  }

  // 检查文档标识符是否已存在
  async checkDocKeyExists(docKey, excludeId) {
    try {
      const params = excludeId ? { excludeId } : {};
      const response = await request({
        type: 'get',
        url: `${this.baseUrl}/checkDocKey/${docKey}`,
        data: params,
      });
      return response.data?.exists || false;
    } catch (error) {
      console.error('检查文档标识符失败:', error);
      // 如果检查失败，返回 false 以避免阻止用户操作
      return false;
    }
  }
}

const documentService = new DocumentService();
export default documentService;
import BaseService from './base/BaseService';
import { request } from '../shared/utils/axios';

class MenuService extends BaseService {
  constructor() {
    super('/menu');
    this.request = request;
  }

  /**
   * @deprecated 已废弃：系统已改为基于常量菜单，不再使用数据库菜单
   * 获取所有菜单（包含按钮）
   */
  async getAllMenus(hasBtn = true) {
    console.warn('getAllMenus 方法已废弃：系统已改为基于常量菜单，请使用 SYSTEM_ROUTES 常量');
    try {
      const response = await this.request({
        type: 'get',
        url: `${this.baseUrl}/all`,
        data: { hasBtn: hasBtn ? 1 : 0 }
      });
      return {
        success: response.success,
        data: response.data || [],
      };
    } catch (error) {
      console.error('获取菜单数据失败:', error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  }

  /**
   * @deprecated 已废弃：系统已改为基于常量菜单，不再支持动态创建菜单
   * 创建菜单
   */
  async create(data) {
    console.warn('create 方法已废弃：系统已改为基于常量菜单，请在 SYSTEM_ROUTES 常量中配置菜单');
    return {
      success: false,
      error: '该功能已废弃，请使用常量菜单配置',
      msg: '该功能已废弃，请使用常量菜单配置',
    };
  }

  /**
   * @deprecated 已废弃：系统已改为基于常量菜单，不再支持动态更新菜单
   * 更新菜单
   */
  async update(id, data) {
    console.warn('update 方法已废弃：系统已改为基于常量菜单，请在 SYSTEM_ROUTES 常量中修改菜单配置');
    return {
      success: false,
      error: '该功能已废弃，请使用常量菜单配置',
      msg: '该功能已废弃，请使用常量菜单配置',
    };
  }

  /**
   * @deprecated 已废弃：系统已改为基于常量菜单，不再支持动态删除菜单
   * 删除菜单
   */
  async delete(id) {
    console.warn('delete 方法已废弃：系统已改为基于常量菜单，请在 SYSTEM_ROUTES 常量中移除菜单配置');
    return {
      success: false,
      error: '该功能已废弃，请使用常量菜单配置',
      msg: '该功能已废弃，请使用常量菜单配置',
    };
  }

  /**
   * @deprecated 已废弃：系统已改为基于常量菜单，不再支持动态获取菜单详情
   * 获取菜单详情
   */
  async detail(id) {
    console.warn('detail 方法已废弃：系统已改为基于常量菜单，请从 SYSTEM_ROUTES 常量中获取菜单信息');
    return {
      success: false,
      error: '该功能已废弃，请使用常量菜单配置',
    };
  }
}

export default new MenuService();
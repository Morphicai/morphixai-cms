import { apiFactory } from './apiFactory';

/**
 * 分类API
 * 使用apiFactory创建标准的CRUD API
 */
const categoryApi = apiFactory('/category');

export default categoryApi;

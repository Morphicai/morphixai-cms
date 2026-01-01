import { apiFactory } from './apiFactory';

/**
 * 文章API
 * 使用apiFactory创建标准的CRUD API
 */
const articleApi = apiFactory('/article');

export default articleApi;

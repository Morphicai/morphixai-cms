import { apiFactory } from './apiFactory';

/**
 * 版本API
 * 使用apiFactory创建标准的CRUD API
 * 注意：版本API是嵌套在文章下的，实际使用时需要通过VersionService调用
 */
const versionApi = apiFactory('/article/:articleId/version');

export default versionApi;

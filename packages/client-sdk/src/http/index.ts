/**
 * HTTP SDK - 导出所有 HTTP 相关的服务
 */

export { BaseHttpService, httpService } from './BaseHttpService';
export { UserSessionService, userSessionService } from './UserSessionService';
export { RequestDeduplication } from './RequestDeduplication';

export type { HttpConfig, RequestOptions } from './BaseHttpService';
export type { ClientUserInfo } from './UserSessionService';

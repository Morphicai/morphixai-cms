import { get, post, put, del } from '@/lib/api';
import { TokenService } from './TokenService';

// 统一的 API 响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp?: string;
}

// 分页响应格式
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 认证相关 DTO
export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

// 合伙人相关 DTO
export interface JoinPartnerDto {
  inviterCode?: string;
  channelCode?: string;
  userRegisterTime: number;
  teamName?: string;
  username: string;
}

export interface QueryTeamDto {
  depth?: number;
  page: number;
  pageSize: number;
}

export interface CreateChannelDto {
  name: string;
  channelCode?: string;
}

// 订单相关 DTO
export interface CreateOrderWithAuthDto {
  productId: string;
  cpOrderNo?: string;
  params?: Record<string, any>;
  extrasParams?: Record<string, any>;
}

export interface QueryOrderDto {
  status?: 'pending' | 'paid' | 'confirmed';
  productId?: string;
  page?: number;
  pageSize?: number;
}

// 积分相关 DTO
export interface NotifyTaskCompletionDto {
  taskCode: string;
  businessParams?: Record<string, any>;
  eventTime?: number;
}

// 外部任务相关 DTO
export interface SubmitExternalTaskDto {
  taskType: string;
  taskLink?: string;
  proofImages?: string[];
  remark?: string;
}

/**
 * 客户端用户服务
 */
export class ClientUserService {
  async register(data: RegisterDto): Promise<ApiResponse> {
    return post('/client-user/register', data);
  }

  async login(data: LoginDto): Promise<ApiResponse> {
    const response = await post('/client-user/login', data);
    
    if (response.code === 200 && response.data?.tokens) {
      // Token 已通过 Cookie 设置，这里可以做额外处理
      console.log('Login successful, tokens set via cookie');
    }
    
    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await post('/client-user/logout');
    
    if (response.code === 200) {
      TokenService.clearTokens();
    }
    
    return response;
  }

  async getProfile(): Promise<ApiResponse> {
    return get('/client-user/profile');
  }

  async getExternalAccounts(): Promise<ApiResponse> {
    return get('/client-user/external-accounts');
  }

  /**
   * 检查登录状态
   */
  isLoggedIn(): boolean {
    return TokenService.isLoggedIn();
  }

  /**
   * 获取当前用户信息（从 Token 解析）
   */
  getCurrentUser() {
    return TokenService.getCurrentUser();
  }
}

/**
 * 合伙人服务
 */
export class PartnerService {
  async join(data: JoinPartnerDto): Promise<ApiResponse> {
    return post('/biz/partner/join', data);
  }

  async getProfile(): Promise<ApiResponse> {
    return get('/biz/partner/profile');
  }

  async getTeam(params: QueryTeamDto): Promise<ApiResponse<PaginatedResponse<any>>> {
    const query = new URLSearchParams(params as any).toString();
    return get(`/biz/partner/team?${query}`);
  }

  async getOverview(): Promise<ApiResponse> {
    return get('/biz/partner/overview');
  }

  async createChannel(data: CreateChannelDto): Promise<ApiResponse> {
    return post('/biz/partner/channels', data);
  }

  async getChannels(): Promise<ApiResponse> {
    return get('/biz/partner/channels');
  }

  async updateTeamName(teamName: string): Promise<ApiResponse> {
    return put('/biz/partner/team-name', { teamName });
  }
}

/**
 * 订单服务
 */
export class OrderService {
  async getProducts(): Promise<ApiResponse> {
    return get('/biz/order/products');
  }

  async getProductParams(productId: string): Promise<ApiResponse> {
    return get(`/biz/order/products/${productId}/params`);
  }

  async createOrder(data: CreateOrderWithAuthDto, uid: string, authToken: string): Promise<ApiResponse> {
    return post('/biz/order/create-with-auth', data, {
      headers: {
        'uid': uid,
        'authToken': authToken
      }
    });
  }

  async getOrderList(params: QueryOrderDto, uid: string, authToken: string): Promise<ApiResponse<PaginatedResponse<any>>> {
    const query = new URLSearchParams(params as any).toString();
    return get(`/biz/order/list?${query}`, {
      headers: {
        'uid': uid,
        'authToken': authToken
      }
    });
  }

  async confirmOrder(orderNo: string, uid: string, authToken: string): Promise<ApiResponse> {
    return post(`/biz/order/${orderNo}/confirm`, {}, {
      headers: {
        'uid': uid,
        'authToken': authToken
      }
    });
  }

  async getPaymentStatus(orderNo: string, uid: string, authToken: string): Promise<ApiResponse> {
    return get(`/biz/order/${orderNo}/payment-status`, {
      headers: {
        'uid': uid,
        'authToken': authToken
      }
    });
  }
}

/**
 * 积分服务
 */
export class PointsService {
  async getMyPoints(includeDetail: boolean = false): Promise<ApiResponse> {
    const query = includeDetail ? '?includeDetail=true' : '';
    return get(`/biz/points/me${query}`);
  }

  async notifyTaskCompletion(data: NotifyTaskCompletionDto): Promise<ApiResponse> {
    return post('/biz/points/notify', data);
  }

  async getMonthlySummary(): Promise<ApiResponse> {
    return get('/biz/points/monthly-summary');
  }
}

/**
 * 外部任务服务
 */
export class ExternalTaskService {
  async getTaskList(): Promise<ApiResponse> {
    return get('/external-task/task-list');
  }

  async getTaskTypes(): Promise<ApiResponse> {
    return get('/external-task/types');
  }

  async submitTask(data: SubmitExternalTaskDto): Promise<ApiResponse> {
    return post('/external-task/submit', data);
  }

  async getMySubmissions(params: { page?: number; pageSize?: number; status?: string } = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    const query = new URLSearchParams(params as any).toString();
    return get(`/external-task/my-submissions?${query}`);
  }

  async updateSubmission(id: string, data: Partial<SubmitExternalTaskDto>): Promise<ApiResponse> {
    return put(`/external-task/submissions/${id}`, data);
  }

  async uploadProof(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return post('/external-task/upload-proof', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      }
    });
  }
}

/**
 * 文章服务
 */
export class ArticleService {
  async getPublicArticles(params: {
    page?: number;
    pageSize?: number;
    categoryCode?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    keyword?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    const query = new URLSearchParams(params as any).toString();
    return get(`/public/articles?${query}`);
  }

  async getArticleBySlug(slug: string): Promise<ApiResponse> {
    return get(`/public/articles/slug/${slug}`);
  }

  async getArticleById(id: string): Promise<ApiResponse> {
    return get(`/public/articles/${id}`);
  }

  async searchArticles(params: {
    keyword: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<any>>> {
    const query = new URLSearchParams(params as any).toString();
    return get(`/public/articles/search?${query}`);
  }
}

/**
 * 文件服务
 */
export class FileService {
  async upload(file: File, options: {
    business?: string;
    needThumbnail?: boolean;
    width?: number;
    height?: number;
    quality?: number;
  } = {}): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    
    return post('/files/upload', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async getFileList(params: {
    page?: number;
    pageSize?: number;
    business?: string;
    keyword?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    const query = new URLSearchParams(params as any).toString();
    return get(`/files/list?${query}`);
  }

  async deleteFile(id: string): Promise<ApiResponse> {
    return del(`/files/${id}`);
  }

  async getHealthStatus(): Promise<ApiResponse> {
    return get('/files/health');
  }

  // 管理员相关方法保持 JWT token 处理
  async uploadAsAdmin(file: File, options: {
    business?: string;
    needThumbnail?: boolean;
    width?: number;
    height?: number;
    quality?: number;
  } = {}): Promise<ApiResponse> {
    const token = this.getAdminJwtToken();
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    
    return post('/files/upload', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  private getAdminJwtToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('jwtToken');
  }
}

// 导出服务实例
export const clientUserService = new ClientUserService();
export const partnerService = new PartnerService();
export const orderService = new OrderService();
export const pointsService = new PointsService();
export const externalTaskService = new ExternalTaskService();
export const articleService = new ArticleService();
export const fileService = new FileService();
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { pathToRegexp } from 'path-to-regexp';

import { AuthMode } from '../enums/auth-mode.enum';
import { AUTH_MODE_KEY } from '../decorators/auth-mode.decorator';
import { ALLOW_ANONYMOUS } from '../decorators/allow-anonymous.decorator';
import { ALLOW_NO_PERM } from '../decorators/perm.decorator';
import { SUPER_ADMIN_KEY } from '../decorators/super-admin.decorator';
import { CHECK_POLICIES_KEY } from '../decorators/use-ability.decorator';
import { UserType } from '../enums/user.enum';
import { UserService } from '../../system/user/user.service';
import { AuthService } from '../../system/auth/auth.service';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { ClientUserService } from '../../business/client-user/client-user.service';

/**
 * 统一认证守卫
 * 支持三种认证模式：
 * 1. ADMIN - 管理员模式（JWT + 角色 + 细粒度权限）
 * 2. CLIENT_USER - 客户端用户模式（签名认证）
 * 3. ANONYMOUS - 匿名模式（无需认证）
 */
@Injectable()
export class UnifiedAuthGuard implements CanActivate {
  private readonly logger = new Logger(UnifiedAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
    private authService: AuthService,
    private caslAbilityFactory: CaslAbilityFactory,
    private clientUserService: ClientUserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // 获取认证模式，默认为管理员模式
    const authMode = this.reflector.getAllAndOverride<AuthMode>(AUTH_MODE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || AuthMode.ADMIN;

    // 检查是否有 @AllowAnonymous 装饰器（向后兼容）
    const allowAnonymous = this.reflector.getAllAndOverride<boolean>(
      ALLOW_ANONYMOUS,
      [context.getHandler(), context.getClass()],
    );

    if (allowAnonymous) {
      return true;
    }

    // 根据认证模式执行不同的认证逻辑
    switch (authMode) {
      case AuthMode.ANONYMOUS:
        return this.handleAnonymousMode(request, context);
      
      case AuthMode.CLIENT_USER:
        return this.handleClientUserMode(request, context);
      
      case AuthMode.ADMIN:
      default:
        return this.handleAdminMode(request, context);
    }
  }

  /**
   * 处理匿名模式
   */
  private async handleAnonymousMode(
    request: Request,
    context: ExecutionContext,
  ): Promise<boolean> {
    this.logger.debug('Using anonymous mode');
    return true;
  }

  /**
   * 处理客户端用户模式
   */
  private async handleClientUserMode(
    request: Request,
    context: ExecutionContext,
  ): Promise<boolean> {
    this.logger.debug('Using client user JWT mode');
    
    // 优先从 Authorization header 获取 token
    let token = this.extractTokenFromHeader(request);
    
    // 如果 header 中没有，从 cookie 中获取
    if (!token) {
      token = request.cookies?.clientAccessToken;
    }

    if (!token) {
      throw new UnauthorizedException('Client user token not found');
    }

    // 验证 JWT token
    const user = await this.clientUserService.verifyToken(token);
    
    if (!user) {
      throw new UnauthorizedException('Invalid client user token');
    }

    // 将用户信息附加到请求
    (request as any).clientUser = {
      userId: user.userId,
      username: user.username,
      userSource: 'CLIENT',
      user: user, // 完整用户信息
    };
    
    return true;
  }

  /**
   * 从请求头中提取 Token
   */
  private extractTokenFromHeader(request: Request): string | null {
    const authorization = request.headers.authorization;
    if (authorization && authorization.startsWith('Bearer ')) {
      return authorization.substring(7);
    }
    return null;
  }

  /**
   * 判断是否是 GameWemade 请求
   */
  private isGameWemadeRequest(request: Request): boolean {
    const gamewemadeUid = request.headers['gamewemade-uid'];
    const businessSign = request.headers['business-sign'];
    const businessTimestamp = request.headers['business-timestamp'];
    
    return !!(gamewemadeUid || businessSign || businessTimestamp);
  }

  /**
   * 处理 GameWemade 认证
   */
  private async handleGameWemadeAuth(request: Request): Promise<boolean> {
    const gamewemadeUid = request.headers['gamewemade-uid'] as string;
    const businessSign = request.headers['business-sign'] as string;
    const businessTimestamp = request.headers['business-timestamp'] as string;

    if (!gamewemadeUid || !businessSign || !businessTimestamp) {
      throw new UnauthorizedException('Missing GameWemade authentication headers');
    }

    // 开发环境跳过签名验证
    if (this.configService.get('NODE_ENV') === 'development') {
      (request as any).clientUser = { 
        userId: gamewemadeUid,
        userSource: 'WEMADE'
      };
      return true;
    }

    // 验证时间戳（5分钟容差）
    const now = Math.floor(Date.now() / 1000);
    const timestamp = parseInt(businessTimestamp);
    const timeDiff = Math.abs(now - timestamp);
    
    if (timeDiff > 300) { // 5分钟
      throw new UnauthorizedException('Request timestamp expired');
    }

    // 生成签名
    const signParams = {
      uid: gamewemadeUid,
      ...request.body,
      ...request.query,
      timestamp: businessTimestamp,
    };

    const signKey = this.configService.get('GAMEWEMADE_SDK_OPEN_KEY');
    if (!signKey) {
      throw new UnauthorizedException('GameWemade authentication not configured');
    }

    const expectedSign = this.generateGameWemadeSignature(signParams, signKey);

    if (expectedSign.toLowerCase() !== businessSign.toLowerCase()) {
      throw new UnauthorizedException('Invalid GameWemade signature');
    }

    // 将用户信息附加到请求（统一格式）
    (request as any).clientUser = { 
      userId: gamewemadeUid,
      userSource: 'WEMADE'
    };
    
    return true;
  }

  /**
   * 处理客户端用户认证
   */
  private async handleClientUserAuth(request: Request): Promise<boolean> {
    const clientUid = request.headers['client-uid'] as string;
    const clientSign = request.headers['client-sign'] as string;
    const clientTimestamp = request.headers['client-timestamp'] as string;

    if (!clientUid || !clientSign || !clientTimestamp) {
      throw new UnauthorizedException('Missing client authentication headers');
    }

    // 开发环境跳过签名验证
    if (this.configService.get('NODE_ENV') === 'development') {
      (request as any).clientUser = { 
        userId: clientUid,
        userSource: 'CLIENT'
      };
      return true;
    }

    // 验证时间戳（5分钟容差）
    const now = Math.floor(Date.now() / 1000);
    const timestamp = parseInt(clientTimestamp);
    const timeDiff = Math.abs(now - timestamp);
    
    if (timeDiff > 300) { // 5分钟
      throw new UnauthorizedException('Request timestamp expired');
    }

    // 生成签名
    const signParams = {
      uid: clientUid,
      ...request.body,
      ...request.query,
      timestamp: clientTimestamp,
    };

    const signKey = this.configService.get('CLIENT_USER_SIGN_KEY');
    if (!signKey) {
      throw new UnauthorizedException('Client user authentication not configured');
    }

    const expectedSign = this.generateSignature(signParams, signKey);

    if (expectedSign !== clientSign) {
      throw new UnauthorizedException('Invalid client signature');
    }

    // 将客户端用户信息附加到请求
    (request as any).clientUser = { 
      userId: clientUid,
      userSource: 'CLIENT'
    };
    
    return true;
  }

  /**
   * 处理管理员模式
   */
  private async handleAdminMode(
    request: Request,
    context: ExecutionContext,
  ): Promise<boolean> {
    this.logger.debug('Using admin mode');

    // 1. JWT 认证
    await this.validateJwtToken(request);

    // 2. 角色权限检查
    await this.validateRolePermissions(request, context);

    // 3. 细粒度权限检查（CASL）
    await this.validateAbilityPermissions(request, context);

    return true;
  }

  /**
   * 验证 JWT Token
   */
  private async validateJwtToken(request: Request): Promise<void> {
    const authorization = request.headers.authorization;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authorization.substring(7);
    
    try {
      // 验证 token
      const isValid = await this.userService.verifyToken(token);
      if (!isValid) {
        throw new UnauthorizedException('Invalid token');
      }

      // 解析 token 获取用户信息
      const payload = this.jwtService.decode(token) as any;
      if (!payload || !payload.id) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // 获取完整用户信息
      const user = await this.authService.validateUser({ id: payload.id });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // 将用户信息附加到请求
      (request as any).user = user;
      
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token validation failed');
    }
  }

  /**
   * 验证角色权限
   */
  private async validateRolePermissions(
    request: Request,
    context: ExecutionContext,
  ): Promise<void> {
    const user = (request as any).user;
    
    // 检查是否允许无权限访问
    const allowNoPerm = this.reflector.getAllAndOverride<boolean>(
      ALLOW_NO_PERM,
      [context.getHandler(), context.getClass()],
    );

    if (allowNoPerm) {
      return;
    }

    // 检查全局白名单
    if (await this.checkWhitelist(request)) {
      return;
    }

    // 检查是否需要超级管理员权限
    const requireSuperAdmin = this.reflector.getAllAndOverride<boolean>(
      SUPER_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requireSuperAdmin && user.type !== UserType.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin access required');
    }

    // 超级管理员直接放行
    if (user.type === UserType.SUPER_ADMIN) {
      return;
    }

    // 这里可以扩展更多的角色权限检查逻辑
    // 例如检查用户是否有访问当前路由的权限
  }

  /**
   * 验证细粒度权限（CASL）
   */
  private async validateAbilityPermissions(
    request: Request,
    context: ExecutionContext,
  ): Promise<void> {
    const user = (request as any).user;
    
    // 获取能力策略处理器
    const policyHandlers = this.reflector.get<Function[]>(
      CHECK_POLICIES_KEY,
      context.getHandler(),
    );

    if (!policyHandlers || policyHandlers.length === 0) {
      return;
    }

    // 创建用户能力对象
    const ability = this.caslAbilityFactory.createForUser(user);

    // 执行所有策略处理器
    for (const handler of policyHandlers) {
      const result = handler(ability);
      if (!result) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }
  }

  /**
   * 检查全局白名单
   */
  private async checkWhitelist(request: Request): Promise<boolean> {
    try {
      const whitelist = this.configService.get('perm.router.whitelist', []);
      const { method, path } = request;

      for (const item of whitelist) {
        if (item.method === '*' || item.method === method) {
          const regexp = pathToRegexp(item.path);
          if (regexp.test(path)) {
            return true;
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to check whitelist', error);
    }

    return false;
  }

  /**
   * 生成签名
   */
  private generateSignature(params: any, key: string): string {
    // 按键名排序
    const sortedKeys = Object.keys(params).sort();
    const sortedParams = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
    
    // 生成 HMAC-SHA256 签名
    return crypto
      .createHmac('sha256', key)
      .update(sortedParams)
      .digest('hex');
  }

  /**
   * 生成 GameWemade MD5 签名
   */
  private generateGameWemadeSignature(params: any, openKey: string): string {
    // 按键名排序
    const sortedKeys = Object.keys(params).sort();
    
    // 拼接键值对
    let signKey = '';
    for (const key of sortedKeys) {
      const value = params[key];
      // 跳过 undefined 和 null 值
      if (value !== undefined && value !== null) {
        // 如果值是对象或数组，转换为 JSON 字符串
        let stringValue: string;
        if (typeof value === 'object') {
          stringValue = JSON.stringify(value);
        } else {
          stringValue = String(value);
        }
        signKey += `${key}=${stringValue}&`;
      }
    }
    
    // 拼接 openKey
    signKey += openKey;
    
    // 生成 MD5 签名
    return crypto
      .createHash('md5')
      .update(signKey)
      .digest('hex');
  }
}
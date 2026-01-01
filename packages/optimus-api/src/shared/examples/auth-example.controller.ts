import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { 
  AdminAuth, 
  ClientUserAuth, 
  AnonymousAuth 
} from '../decorators/auth-mode.decorator';
import { AllowAnonymous } from '../decorators/allow-anonymous.decorator';
import { AllowNoPerm } from '../decorators/perm.decorator';
import { RequireSuperAdmin } from '../decorators/super-admin.decorator';
import { UseAbility } from '../decorators/use-ability.decorator';
import { Action } from '../enums/casl.enum';

/**
 * 认证守卫使用示例控制器
 * 展示统一认证守卫的各种使用方式
 */
@Controller('auth-examples')
export class AuthExampleController {
  
  /**
   * 默认管理员模式
   * 需要 JWT + 角色 + 权限验证
   */
  @Get('admin-default')
  getAdminDefault(@Req() req: Request) {
    const user = (req as any).user;
    return {
      message: '管理员默认模式',
      user: {
        id: user.id,
        account: user.account,
        type: user.type
      }
    };
  }

  /**
   * 显式指定管理员模式
   */
  @Get('admin-explicit')
  @AdminAuth()
  getAdminExplicit(@Req() req: Request) {
    const user = (req as any).user;
    return {
      message: '管理员显式模式',
      user: {
        id: user.id,
        account: user.account,
        roleIds: user.roleIds,
        perms: user.perms
      }
    };
  }

  /**
   * 管理员模式 + 超级管理员权限
   */
  @Get('super-admin')
  @AdminAuth()
  @RequireSuperAdmin()
  getSuperAdmin(@Req() req: Request) {
    const user = (req as any).user;
    return {
      message: '超级管理员专用接口',
      user: {
        id: user.id,
        account: user.account,
        type: user.type
      }
    };
  }

  /**
   * 管理员模式 + 允许无权限
   */
  @Get('admin-no-perm')
  @AdminAuth()
  @AllowNoPerm()
  getAdminNoPerm(@Req() req: Request) {
    const user = (req as any).user;
    return {
      message: '管理员模式但允许无权限',
      user: {
        id: user.id,
        account: user.account
      }
    };
  }

  /**
   * 管理员模式 + CASL 细粒度权限
   */
  @Get('admin-casl')
  @AdminAuth()
  @UseAbility((ability) => ability.can(Action.Read, 'Article'))
  getAdminCasl(@Req() req: Request) {
    const user = (req as any).user;
    return {
      message: '管理员模式 + CASL 权限控制',
      user: {
        id: user.id,
        account: user.account,
        hasArticleReadPermission: true
      }
    };
  }

  /**
   * 客户端用户模式
   * 需要签名认证
   */
  @Post('client-user')
  @ClientUserAuth()
  createClientOrder(@Body() orderData: any, @Req() req: Request) {
    const clientUser = (req as any).clientUser;
    return {
      message: '客户端用户模式',
      clientUser: {
        uid: clientUser.uid
      },
      orderData
    };
  }

  /**
   * 匿名模式
   * 任何用户都可以访问
   */
  @Get('anonymous')
  @AnonymousAuth()
  getAnonymous() {
    return {
      message: '匿名模式，任何用户都可以访问',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 向后兼容 - 使用旧的 @AllowAnonymous 装饰器
   */
  @Get('legacy-anonymous')
  @AllowAnonymous()
  getLegacyAnonymous() {
    return {
      message: '向后兼容的匿名访问',
      note: '@AllowAnonymous() 装饰器仍然有效'
    };
  }

  /**
   * 健康检查接口
   * 通常用于负载均衡器检查
   */
  @Get('health')
  @AnonymousAuth()
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'optimus-api'
    };
  }

  /**
   * 公开 API 信息
   */
  @Get('info')
  @AnonymousAuth()
  getInfo() {
    return {
      name: 'Optimus API',
      version: '1.0.0',
      description: '统一认证守卫示例',
      authModes: [
        'ADMIN - 管理员模式（默认）',
        'CLIENT_USER - 客户端用户模式',
        'ANONYMOUS - 匿名模式'
      ]
    };
  }
}

/**
 * 客户端 API 示例
 * 专门用于客户端签名认证的接口
 */
@Controller('api/client')
export class ClientApiExampleController {

  /**
   * 创建订单
   * 需要客户端签名认证
   */
  @Post('orders')
  @ClientUserAuth()
  createOrder(@Body() createOrderDto: any, @Req() req: Request) {
    const clientUser = (req as any).clientUser;
    
    return {
      message: '订单创建成功',
      orderId: `ORDER_${Date.now()}`,
      clientUid: clientUser.uid,
      orderData: createOrderDto
    };
  }

  /**
   * 获取用户信息
   * 需要客户端签名认证
   */
  @Get('profile')
  @ClientUserAuth()
  getProfile(@Req() req: Request) {
    const clientUser = (req as any).clientUser;
    
    return {
      message: '用户信息获取成功',
      profile: {
        uid: clientUser.uid,
        // 这里可以根据 uid 查询更多用户信息
      }
    };
  }

  /**
   * 公开接口 - 获取商品列表
   */
  @Get('products')
  @AnonymousAuth()
  getProducts() {
    return {
      message: '商品列表',
      products: [
        { id: 1, name: '商品1', price: 100 },
        { id: 2, name: '商品2', price: 200 }
      ]
    };
  }
}
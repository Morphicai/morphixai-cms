import { ApiEndpoint } from './types';

/**
 * 示例 API 数据
 * 用于测试和演示 API 文档组件
 */
export const sampleApiEndpoints: ApiEndpoint[] = [
  {
    id: 'user-login',
    method: 'POST',
    path: '/client-user/login',
    summary: '用户登录',
    description: '使用用户名和密码进行登录认证，成功后返回访问令牌。',
    tags: ['认证', '用户'],
    authentication: false,
    parameters: [
      {
        name: 'username',
        in: 'query',
        description: '用户名或邮箱地址',
        required: true,
        type: 'string',
        example: 'demo@example.com',
      },
      {
        name: 'password',
        in: 'query',
        description: '用户密码',
        required: true,
        type: 'string',
        example: 'password123',
      },
    ],
    requestBody: {
      description: '登录请求数据',
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            description: '用户名或邮箱',
            example: 'demo@example.com',
          },
          password: {
            type: 'string',
            description: '密码',
            example: 'password123',
          },
        },
        required: ['username', 'password'],
        example: {
          username: 'demo@example.com',
          password: 'password123',
        },
      },
    },
    responses: [
      {
        statusCode: 200,
        description: '登录成功',
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
              description: '响应状态码',
              example: 200,
            },
            message: {
              type: 'string',
              description: '响应消息',
              example: '登录成功',
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'JWT 访问令牌',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                user: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'number',
                      description: '用户ID',
                      example: 1,
                    },
                    username: {
                      type: 'string',
                      description: '用户名',
                      example: 'demo',
                    },
                    email: {
                      type: 'string',
                      description: '邮箱地址',
                      example: 'demo@example.com',
                    },
                  },
                },
              },
            },
          },
          example: {
            code: 200,
            message: '登录成功',
            data: {
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              user: {
                id: 1,
                username: 'demo',
                email: 'demo@example.com',
              },
            },
          },
        },
      },
      {
        statusCode: 401,
        description: '认证失败',
        contentType: 'application/json',
        schema: {
          type: 'object',
          example: {
            code: 401,
            message: '用户名或密码错误',
            data: null,
          },
        },
      },
    ],
    examples: [
      {
        name: '成功登录',
        summary: '使用正确的用户名和密码登录',
        value: {
          username: 'demo@example.com',
          password: 'password123',
        },
      },
    ],
  },
  {
    id: 'user-profile',
    method: 'GET',
    path: '/client-user/profile',
    summary: '获取用户信息',
    description: '获取当前登录用户的详细信息。需要提供有效的访问令牌。',
    tags: ['用户'],
    authentication: true,
    parameters: [
      {
        name: 'Authorization',
        in: 'header',
        description: 'Bearer 令牌',
        required: true,
        type: 'string',
        example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: '获取成功',
        contentType: 'application/json',
        schema: {
          type: 'object',
          example: {
            code: 200,
            message: '获取成功',
            data: {
              id: 1,
              username: 'demo',
              email: 'demo@example.com',
              nickname: '演示用户',
              avatar: 'https://example.com/avatar.jpg',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-15T12:00:00Z',
            },
          },
        },
      },
      {
        statusCode: 401,
        description: '未授权访问',
        contentType: 'application/json',
        schema: {
          type: 'object',
          example: {
            code: 401,
            message: '访问令牌无效或已过期',
            data: null,
          },
        },
      },
    ],
    examples: [
      {
        name: '获取用户信息',
        summary: '使用有效令牌获取用户信息',
        value: {},
      },
    ],
  },
  {
    id: 'user-register',
    method: 'POST',
    path: '/client-user/register',
    summary: '用户注册',
    description: '创建新的用户账号。需要提供用户名、邮箱和密码。',
    tags: ['认证', '用户'],
    authentication: false,
    requestBody: {
      description: '注册请求数据',
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            description: '用户名（3-20个字符）',
            example: 'newuser',
          },
          email: {
            type: 'string',
            description: '邮箱地址',
            example: 'newuser@example.com',
          },
          password: {
            type: 'string',
            description: '密码（至少6个字符）',
            example: 'password123',
          },
          nickname: {
            type: 'string',
            description: '昵称（可选）',
            example: '新用户',
          },
        },
        required: ['username', 'email', 'password'],
        example: {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          nickname: '新用户',
        },
      },
    },
    responses: [
      {
        statusCode: 201,
        description: '注册成功',
        contentType: 'application/json',
        schema: {
          type: 'object',
          example: {
            code: 201,
            message: '注册成功',
            data: {
              id: 2,
              username: 'newuser',
              email: 'newuser@example.com',
              nickname: '新用户',
              createdAt: '2024-01-15T12:00:00Z',
            },
          },
        },
      },
      {
        statusCode: 400,
        description: '请求参数错误',
        contentType: 'application/json',
        schema: {
          type: 'object',
          example: {
            code: 400,
            message: '用户名已存在',
            data: null,
          },
        },
      },
    ],
    examples: [
      {
        name: '用户注册',
        summary: '创建新用户账号',
        value: {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          nickname: '新用户',
        },
      },
    ],
  },
  {
    id: 'partner-list',
    method: 'GET',
    path: '/partner',
    summary: '获取合伙人列表',
    description: '获取当前用户的合伙人列表，支持分页和筛选。',
    tags: ['合伙人'],
    authentication: true,
    parameters: [
      {
        name: 'Authorization',
        in: 'header',
        description: 'Bearer 令牌',
        required: true,
        type: 'string',
        example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      {
        name: 'page',
        in: 'query',
        description: '页码（从1开始）',
        required: false,
        type: 'number',
        example: 1,
        default: 1,
      },
      {
        name: 'pageSize',
        in: 'query',
        description: '每页数量',
        required: false,
        type: 'number',
        example: 10,
        default: 10,
      },
      {
        name: 'status',
        in: 'query',
        description: '合伙人状态',
        required: false,
        type: 'string',
        enum: ['active', 'inactive', 'pending'],
        example: 'active',
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: '获取成功',
        contentType: 'application/json',
        schema: {
          type: 'object',
          example: {
            code: 200,
            message: '获取成功',
            data: {
              list: [
                {
                  id: 1,
                  name: '张三',
                  email: 'zhangsan@example.com',
                  status: 'active',
                  level: 1,
                  commission: 0.1,
                  createdAt: '2024-01-01T00:00:00Z',
                },
              ],
              pagination: {
                page: 1,
                pageSize: 10,
                total: 1,
                totalPages: 1,
              },
            },
          },
        },
      },
    ],
    examples: [
      {
        name: '获取合伙人列表',
        summary: '获取第一页的合伙人数据',
        value: {},
      },
    ],
  },
];
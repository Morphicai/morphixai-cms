# GameWemade SDK 客户端

用于与 GameWemade SDK 开放平台进行交互的 TypeScript 客户端库。

## 安装依赖

```bash
pnpm add form-data
pnpm add -D @types/form-data
```

## 快速开始

```typescript
import { GameWemadeSDK } from '@/shared/libs/gamewemade';
import { md5Password } from '@/shared/libs/gamewemade/utils/sign';

// 创建客户端实例
const sdk = new GameWemadeSDK({
  openId: 'your-open-id',           // 开放平台开发者身份ID
  openKey: 'your-open-key',         // SDK分配的加密串
  productCode: 'your-product-code', // 产品CODE
  baseUrl: 'http://custom-sdkapi.gamewemade.com', // API基础URL（可选）
  channelCode: 'website',           // CPS分包标识（可选，默认website）
});

// 通用请求 - 用户登录示例
const loginResult = await sdk.request('/webOpen/userLogin', {
  username: 'testuser',
  password: md5Password('password123'), // 密码需要MD5编码
});

if (loginResult.status) {
  console.log('登录成功:', loginResult.data);
  const { uid, username, authToken } = loginResult.data;
} else {
  console.error('登录失败:', loginResult.message);
}

// 检查 Token
const tokenResult = await sdk.checkToken({
  authToken: 'your-auth-token',
  uid: 'user-id', // 可选，用于验证
});

if (tokenResult.status) {
  console.log('Token 有效:', tokenResult.data);
} else {
  console.error('Token 无效:', tokenResult.message);
}
```

## API 接口

### 通用请求方法

```typescript
/**
 * 通用请求方法
 * 自动处理签名，使用 form-data 格式发送请求
 * 
 * @param endpoint API 端点路径（如：/webOpen/userRegister）
 * @param params 请求参数（不包含 sign，会自动计算）
 * @returns Promise<ApiResponse<T>>
 */
const result = await sdk.request<T>('/webOpen/userLogin', {
  username: 'testuser',
  password: md5Password('password123'),
});
```

### 检查 Token

```typescript
/**
 * 检查 Token
 * 验证 authToken 是否有效，并获取用户信息
 */
const result = await sdk.checkToken({
  authToken: 'your-auth-token',
  uid: 'user-id', // 可选，用于验证
});
```

## 类型定义

主要类型定义可以从包中导入：

```typescript
import {
  SDKConfig,
  ApiResponse,
  UserInfo,
  CheckTokenParams,
} from '@/shared/libs/gamewemade';
import { md5Password } from '@/shared/libs/gamewemade/utils/sign';
```

## 签名算法

客户端自动处理签名，签名算法如下：

1. 将需要传递的参数按首字母升序排序
2. 将所有键值对按 `key1=val1&key2=val2&key3=val3&` 格式进行拼接
3. 在第2步拼接的字符后拼接SDK分配的openKey
4. 将第3步处理的字符串进行md5编码，得到32位小写md5值

## 错误处理

所有 API 方法都会返回 `ApiResponse<T>` 格式的响应：

```typescript
interface ApiResponse<T> {
  status: boolean;  // 接口验证状态
  message: string; // 错误提示语（status为false时）
  data: T;         // 返回数据（status为true时）
}
```

如果请求失败（网络错误等），会抛出异常：

```typescript
try {
  const result = await sdk.userLogin({ username: 'test', password: 'pass' });
} catch (error) {
  console.error('请求失败:', error.message);
}
```

## 环境兼容性

客户端自动检测运行环境：
- **Node.js 环境**：使用 `form-data` 包
- **浏览器环境**：使用 `URLSearchParams`

## 注意事项

1. 密码需要手动进行 MD5 编码，可以使用 `md5Password` 工具函数
2. 所有请求都使用 `form-data` 格式（浏览器环境使用 `application/x-www-form-urlencoded`）
3. 签名会自动计算，无需手动处理
4. 通用请求方法可以调用任何 GameWemade SDK API 接口


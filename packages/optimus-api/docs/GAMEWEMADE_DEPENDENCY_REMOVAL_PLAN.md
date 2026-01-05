# GameWemade 依赖移除方案

## 一、现状分析

### 1.1 当前依赖关系

#### 认证守卫层
- **ClientUserAuthGuard** ✅ 已正确使用 `CLIENT_USER_SIGN_KEY`
- **GameWemadeAuthGuard** ❌ 使用 `GAMEWEMADE_SDK_OPEN_KEY`，但**未被使用**
- **UnifiedAuthGuard** ⚠️ 包含 `handleGameWemadeAuth` 方法，使用 `GAMEWEMADE_SDK_OPEN_KEY`，但**未被调用**

#### 业务服务层
- **GameWemadeTokenValidationService** ⚠️ 依赖 `GameWemadeSDKService`，但**可能未被使用**
- **PaymentCallbackService** ❌ 依赖 `GAMEWEMADE_SDK_CALLBACK_KEY` 和 `GAMEWEMADE_SDK_MD5_KEY`

#### SDK 服务层
- **GameWemadeSDKService** ❌ 依赖多个 GameWemade 环境变量
- **GameWemadeModule** ❌ 全局模块，导出 GameWemade 相关服务

### 1.2 使用情况统计

#### 认证装饰器使用
- `@ClientUserAuth()` - 大量使用（订单、预约、奖励等）
- `@UseGuards(ClientUserAuthGuard)` - 大量使用（合伙人、积分、外部任务等）
- `@UseGuards(GameWemadeAuthGuard)` - **未被使用**
- `@RequireGameWemadeAuth()` - **未被使用**

#### 业务逻辑使用
- `GameWemadeTokenValidationService` - 注入到 `OrderService`，但**未找到实际调用**
- `PaymentCallbackService` - 在 `/biz/order/payment-callback` 接口中使用

## 二、问题确认

### 2.1 ClientUserAuth 和 GameWemadeGuard 的关系

**结论：不是同一个**

- **ClientUserAuthGuard**：
  - Header 字段：`client-uid`, `client-sign`, `client-timestamp`
  - 签名密钥：`CLIENT_USER_SIGN_KEY`
  - 签名算法：使用 `generateSign` (MD5)
  - 用户信息：附加到 `req.clientUser`

- **GameWemadeAuthGuard**：
  - Header 字段：`gamewemade-uid`, `business-sign`, `business-timestamp`
  - 签名密钥：`GAMEWEMADE_SDK_OPEN_KEY`
  - 签名算法：使用 `generateSign` (MD5)
  - 用户信息：附加到 `req.gameWemadeUser`

- **UnifiedAuthGuard.handleGameWemadeAuth**：
  - 与 GameWemadeAuthGuard 逻辑相同
  - 但**未被调用**（`handleClientUserMode` 只处理 JWT token）

### 2.2 支付回调依赖分析

**当前实现**：
- 使用 GameWemade 特定的加密格式（`@171@174@188...`）
- 使用 `GAMEWEMADE_SDK_CALLBACK_KEY` 解密
- 使用 `GAMEWEMADE_SDK_MD5_KEY` 验证签名
- 解析 XML 格式的支付数据

**需要改为**：
- 使用通用的支付回调格式
- 不依赖 GameWemade 特定的加密/解密逻辑

## 三、修改方案

### 3.1 阶段一：修复 UnifiedAuthGuard 中的 GameWemade 依赖

**问题**：`UnifiedAuthGuard.handleGameWemadeAuth` 使用 `GAMEWEMADE_SDK_OPEN_KEY`，但该方法未被调用。

**方案**：
1. **删除 `handleGameWemadeAuth` 方法**（未被使用）
2. **删除 `isGameWemadeRequest` 方法**（未被使用）
3. **删除 `generateGameWemadeSignature` 方法**（未被使用）

**影响**：无（方法未被调用）

### 3.2 阶段二：移除 GameWemadeAuthGuard

**问题**：`GameWemadeAuthGuard` 使用 `GAMEWEMADE_SDK_OPEN_KEY`，但未被使用。

**方案**：
1. **标记为废弃**（Deprecated），保留代码但添加警告
2. 或者**直接删除**（如果确认不需要）

**影响**：无（未被使用）

### 3.3 阶段三：重构 PaymentCallbackService

**问题**：支付回调依赖 GameWemade 特定的加密格式和密钥。

**方案**：

#### 方案 A：通用支付回调服务（推荐）

1. **创建通用支付回调接口**
```typescript
interface PaymentCallbackData {
  uid: string;
  orderNo: string;        // 我们的订单号
  sdkOrderNo?: string;     // SDK订单号（可选）
  amount: number;
  payTime: Date;
  extrasParams?: string;
  // ... 其他字段
}
```

2. **创建通用支付回调服务**
```typescript
@Injectable()
export class GenericPaymentCallbackService {
  // 使用通用密钥
  private readonly callbackKey: string;  // PAYMENT_CALLBACK_KEY
  private readonly md5Key: string;       // PAYMENT_CALLBACK_MD5_KEY
  
  // 支持多种格式的支付回调
  async processCallback(params: any): Promise<PaymentCallbackData> {
    // 1. 检测回调格式（GameWemade 或其他）
    // 2. 根据格式选择对应的解析器
    // 3. 统一返回格式
  }
}
```

3. **保持向后兼容**
   - 如果检测到 GameWemade 格式，使用旧的解密逻辑
   - 如果检测到新格式，使用新的解析逻辑
   - 通过环境变量控制是否启用 GameWemade 支持

#### 方案 B：完全移除 GameWemade 支付回调

1. **删除 `PaymentCallbackService` 中的 GameWemade 相关代码**
2. **创建新的通用支付回调服务**
3. **更新 `/biz/order/payment-callback` 接口**

**推荐**：使用方案 A，保持向后兼容

### 3.4 阶段四：移除 GameWemadeTokenValidationService

**问题**：依赖 `GameWemadeSDKService`，但可能未被使用。

**方案**：
1. **检查是否被使用**
   - 搜索 `tokenValidationService.validateToken` 的调用
   - 如果未被使用，直接删除
   - 如果被使用，需要找到替代方案

2. **如果被使用，提供替代方案**
   - 如果只是验证用户身份，可以通过签名认证完成（已在守卫中完成）
   - 如果需要验证 token，可以创建通用的 token 验证服务

### 3.5 阶段五：移除 GameWemadeSDKService 和 GameWemadeModule

**问题**：全局模块，但可能不再需要。

**方案**：
1. **检查依赖关系**
   - 搜索所有使用 `GameWemadeSDKService` 的地方
   - 确认是否还有其他服务依赖

2. **移除步骤**
   - 从 `app.module.ts` 中移除 `GameWemadeModule`
   - 删除 `GameWemadeModule` 文件
   - 删除 `GameWemadeSDKService` 文件
   - 删除 `GameWemadeSDK` 客户端文件

### 3.6 阶段六：清理环境变量

**需要移除的环境变量**：
- `GAMEWEMADE_SDK_OPEN_ID`
- `GAMEWEMADE_SDK_OPEN_KEY`
- `GAMEWEMADE_SDK_PRODUCT_CODE`
- `GAMEWEMADE_SDK_BASE_URL`
- `GAMEWEMADE_SDK_CHANNEL_CODE`
- `GAMEWEMADE_SDK_CALLBACK_KEY`（如果支付回调改为通用）
- `GAMEWEMADE_SDK_MD5_KEY`（如果支付回调改为通用）

**新增环境变量**（如果需要）：
- `PAYMENT_CALLBACK_KEY`（通用支付回调解密密钥）
- `PAYMENT_CALLBACK_MD5_KEY`（通用支付回调签名密钥）

## 四、实施步骤

### 步骤 1：代码审查和确认
1. ✅ 确认 `GameWemadeTokenValidationService` 是否被使用
2. ✅ 确认 `GameWemadeAuthGuard` 是否真的未被使用
3. ✅ 确认支付回调是否真的不再依赖 GameWemade

### 步骤 2：修复 UnifiedAuthGuard
- [ ] 删除 `handleGameWemadeAuth` 方法
- [ ] 删除 `isGameWemadeRequest` 方法
- [ ] 删除 `generateGameWemadeSignature` 方法
- [ ] 测试确保不影响现有功能

### 步骤 3：重构支付回调服务
- [ ] 创建通用支付回调接口
- [ ] 创建通用支付回调服务
- [ ] 保持向后兼容（支持 GameWemade 格式）
- [ ] 更新 `OrderService` 使用新服务
- [ ] 测试支付回调功能

### 步骤 4：移除未使用的服务
- [ ] 确认 `GameWemadeTokenValidationService` 未被使用后删除
- [ ] 标记或删除 `GameWemadeAuthGuard`
- [ ] 测试确保不影响现有功能

### 步骤 5：移除 SDK 服务
- [ ] 确认 `GameWemadeSDKService` 未被使用
- [ ] 从 `app.module.ts` 移除 `GameWemadeModule`
- [ ] 删除相关文件
- [ ] 测试确保不影响现有功能

### 步骤 6：清理环境变量
- [ ] 更新 `.env.example`
- [ ] 更新文档
- [ ] 通知团队更新配置

## 五、风险评估

### 5.1 高风险项
1. **支付回调重构** - 影响核心业务功能
   - 缓解措施：保持向后兼容，充分测试

### 5.2 中风险项
1. **移除认证守卫** - 可能影响现有接口
   - 缓解措施：先标记为废弃，观察一段时间后再删除

### 5.3 低风险项
1. **移除未使用的服务** - 影响较小
   - 缓解措施：确认未被使用后再删除

## 六、测试计划

### 6.1 单元测试
- [ ] 测试 `UnifiedAuthGuard` 修改后功能正常
- [ ] 测试通用支付回调服务
- [ ] 测试向后兼容性

### 6.2 集成测试
- [ ] 测试所有使用 `@ClientUserAuth()` 的接口
- [ ] 测试支付回调接口
- [ ] 测试订单创建和查询流程

### 6.3 回归测试
- [ ] 测试所有业务功能不受影响
- [ ] 测试认证功能正常
- [ ] 测试支付流程正常

## 七、回滚方案

如果出现问题，可以：
1. **恢复代码**：从 Git 历史恢复相关文件
2. **恢复环境变量**：重新配置 GameWemade 相关环境变量
3. **恢复模块**：在 `app.module.ts` 中重新导入 `GameWemadeModule`

## 八、注意事项

1. **向后兼容**：支付回调服务需要保持向后兼容，支持旧的 GameWemade 格式
2. **渐进式迁移**：建议分阶段实施，每个阶段完成后充分测试
3. **文档更新**：及时更新 API 文档和开发文档
4. **团队通知**：通知团队成员环境变量变更

## 九、待确认问题

1. ✅ **已确认**：`GameWemadeTokenValidationService` 虽然被注入到 `OrderService`，但**未被实际调用**（搜索代码未找到 `tokenValidationService.` 的调用）
2. ❓ 支付回调是否真的不再依赖 GameWemade？（需要业务确认）
3. ❓ 是否有其他服务间接依赖 GameWemade SDK？
4. ❓ 是否需要保留 GameWemade 支持作为可选功能？

## 十、关键发现

### 10.1 ClientUserAuth 和 GameWemadeGuard 的区别

**确认**：不是同一个，且 `ClientUserAuth` 已经正确使用 `CLIENT_USER_SIGN_KEY`

- `@ClientUserAuth()` 装饰器 → 使用 `UnifiedAuthGuard`（全局守卫）→ `handleClientUserMode`（只处理 JWT token）⚠️
- `@UseGuards(ClientUserAuthGuard)` → 使用 `ClientUserAuthGuard` → 使用 `CLIENT_USER_SIGN_KEY` ✅
- `GameWemadeAuthGuard` → 使用 `GAMEWEMADE_SDK_OPEN_KEY` ❌（未被使用）

**重要发现**：
1. `UnifiedAuthGuard` 被注册为全局守卫（`APP_GUARD`）
2. `@ClientUserAuth()` 装饰器使用的是 `UnifiedAuthGuard`，但 `handleClientUserMode` 只处理 JWT token，**不处理签名认证**
3. 实际业务中大量使用 `@UseGuards(ClientUserAuthGuard)`，这个守卫是独立的，已经正确使用 `CLIENT_USER_SIGN_KEY`
4. **问题**：如果业务代码使用 `@ClientUserAuth()`，可能无法正确处理签名认证，需要确认实际使用情况

### 10.2 UnifiedAuthGuard 中的冗余代码

**确认**：`UnifiedAuthGuard` 中的 `handleGameWemadeAuth` 方法**未被调用**

- `handleClientUserMode` 只处理 JWT token，不调用 `handleGameWemadeAuth`
- 可以安全删除这些方法

### 10.3 GameWemadeTokenValidationService

**确认**：虽然被注入，但**未被使用**

- 在 `OrderService` 构造函数中注入
- 但在整个 `OrderService` 中未找到任何调用
- 可以安全删除


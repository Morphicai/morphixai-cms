/**
 * GameWemade SDK 客户端
 *
 * 用于与 GameWemade SDK 开放平台进行交互的 TypeScript 客户端库
 *
 * @example
 * ```typescript
 * import { GameWemadeSDK, md5Password } from '@/shared/libs/gamewemade';
 *
 * const sdk = new GameWemadeSDK({
 *   openId: 'your-open-id',
 *   openKey: 'your-open-key',
 *   productCode: 'your-product-code',
 * });
 *
 * // 通用请求 - 用户登录
 * const result = await sdk.request('/webOpen/userLogin', {
 *   username: 'testuser',
 *   password: md5Password('password123')
 * });
 *
 * // 检查 Token
 * const tokenResult = await sdk.checkToken({
 *   authToken: 'your-auth-token'
 * });
 * ```
 */

export * from "./types";
export * from "./utils/sign";
export { GameWemadeSDK } from "./client";
export { GameWemadeSDKService } from "./gamewemade.service";
export { GameWemadeModule } from "./gamewemade.module";
export {
    RequireGameWemadeAuth,
    GAMEWEMADE_UID_HEADER,
    GAMEWEMADE_SIGNATURE_HEADER,
    GAMEWEMADE_TIMESTAMP_HEADER,
} from "../../decorators/require-gamewemade-auth.decorator";
export { GameWemadeAuthGuard } from "../../guards/gamewemade-auth.guard";

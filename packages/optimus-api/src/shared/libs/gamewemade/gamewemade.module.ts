import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GameWemadeSDKService } from "./gamewemade.service";
import { GameWemadeAuthGuard } from "../../guards/gamewemade-auth.guard";

/**
 * GameWemade SDK 全局模块
 *
 * 提供全局的 GameWemadeSDK 服务，可以在任何模块中直接注入使用
 *
 * @example
 * ```typescript
 * import { GameWemadeSDKService } from '@/shared/libs/gamewemade/gamewemade.service';
 *
 * @Injectable()
 * export class SomeService {
 *   constructor(private readonly gameWemadeSDK: GameWemadeSDKService) {}
 *
 *   async someMethod() {
 *     const result = await this.gameWemadeSDK.checkToken({
 *       authToken: 'token',
 *       uid: '123'
 *     });
 *   }
 * }
 * ```
 */
@Global()
@Module({
    imports: [ConfigModule],
    providers: [GameWemadeSDKService, GameWemadeAuthGuard],
    exports: [GameWemadeSDKService, GameWemadeAuthGuard],
})
export class GameWemadeModule {}

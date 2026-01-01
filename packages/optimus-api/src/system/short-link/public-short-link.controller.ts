import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";
import { ShortLinkService } from "./short-link.service";
import { ResolveShortLinkDto } from "./dto/short-link.dto";
import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { AllowNoPerm } from "../../shared/decorators/perm.decorator";
import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";

@ApiTags("短链解析（公开接口）")
@Controller("/public/short-link")
export class PublicShortLinkController {
    constructor(private readonly shortLinkService: ShortLinkService) {}

    @Get("resolve/:token")
    @AllowAnonymous()
    @AllowNoPerm()
    @ApiOperation({ summary: "解析短链token，获取目标内容" })
    @ApiParam({ name: "token", description: "6位短链token", example: "abc123" })
    @ApiQuery({ name: "platform", description: "平台标识（android/ios/pc）", required: false })
    @ApiResult(ResolveShortLinkDto)
    async resolve(@Param("token") token: string, @Query("platform") platform?: string): Promise<ResultData> {
        const target = await this.shortLinkService.resolve(token, platform);
        return ResultData.ok({ target });
    }
}

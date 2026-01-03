import { Controller, Get, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";
import { AllowBeforeInitialization } from "../../shared/decorators/allow-before-initialization.decorator";
import { ResultData } from "../../shared/utils/result";
import { SetupService } from "./setup.service";
import { SetupStatusDto } from "./dto/setup-status.dto";
import { InitializeSystemDto } from "./dto/initialize-system.dto";

@ApiTags("系统安装")
@Controller("setup")
export class SetupController {
    constructor(private readonly setupService: SetupService) {}

    @Get("status")
    @ApiOperation({ summary: "获取系统状态" })
    @ApiResponse({ status: 200, description: "获取系统状态成功" })
    @AllowAnonymous()
    @AllowBeforeInitialization()
    async getStatus(): Promise<ResultData> {
        const status = await this.setupService.getStatus();
        return ResultData.ok(status);
    }

    @Post("initialize")
    @ApiOperation({ summary: "初始化系统" })
    @ApiResponse({ status: 200, description: "系统初始化成功" })
    @ApiResponse({ status: 400, description: "系统初始化失败" })
    @AllowAnonymous()
    @AllowBeforeInitialization()
    async initialize(@Body() dto: InitializeSystemDto): Promise<ResultData> {
        await this.setupService.initializeSystem(dto);
        return ResultData.ok(null, "系统初始化成功");
    }
}

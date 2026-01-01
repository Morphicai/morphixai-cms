import { Body, Param, Controller, Post, Get, Req, HttpCode } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags, ApiExtraModels } from "@nestjs/swagger";

import { ResultData } from "../../shared/utils/result";
import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";
import { AllowNoPerm } from "../../shared/decorators/perm.decorator";
import { ApiResult } from "../../shared/decorators/api-result.decorator";

import { UserEntity } from "./user.entity";
import { UserService } from "./user.service";
import { BaseService } from "./base.service";

import { LoginUser } from "./dto/login-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { CreateTokenDto } from "./dto/create-token.dto";
import { ImageCaptchaDto } from "./dto/image-captcha.dto";

@ApiTags("登录注册")
@ApiExtraModels(ResultData, UserEntity, CreateTokenDto)
@Controller()
export class BaseController {
    constructor(private readonly userService: UserService, private readonly baseService: BaseService) {}

    @Post("register")
    @ApiOperation({ summary: "用户注册" })
    @ApiResult(UserEntity)
    @AllowAnonymous()
    create(@Body() user: CreateUserDto): Promise<ResultData> {
        return this.userService.create(user);
    }

    @Post("login")
    @ApiOperation({ summary: "登录" })
    @ApiResult(CreateTokenDto)
    @AllowAnonymous()
    login(@Body() user: LoginUser): Promise<ResultData> {
        return this.userService.login(user);
    }

    @Get("captcha/img")
    @ApiOperation({ summary: "获取验证码" })
    @ApiResult()
    @AllowAnonymous()
    createImageCaptcha(@Param() captcha: ImageCaptchaDto): Promise<ResultData> {
        return this.baseService.createImageCaptcha(captcha);
    }

    @Post("changePassword")
    @ApiOperation({ summary: "根据旧密码，更改新密码" })
    @HttpCode(200)
    @AllowNoPerm()
    @ApiBearerAuth()
    @ApiResult()
    changePassword(@Body() dto: ChangePasswordDto, @Req() req): Promise<ResultData> {
        return this.userService.changePasswordByOldPassword(req.user.id, dto.password, dto.newPassword);
    }

    @Post("/update/token")
    @ApiOperation({ summary: "刷新token" })
    @ApiResult(CreateTokenDto)
    @AllowNoPerm()
    @ApiBearerAuth()
    updateToken(@Req() req): Promise<ResultData> {
        return this.userService.updateToken(req.user.id);
    }
}

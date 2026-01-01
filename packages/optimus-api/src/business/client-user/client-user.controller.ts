import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { CryptoUtil } from "@optimus/common";
import { ClientUserService } from "./client-user.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ClientUserAuth, AnonymousAuth } from "../../shared/decorators/auth-mode.decorator";
import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";

@ApiTags("客户端用户")
@Controller("client-user")
export class ClientUserController {
    constructor(
        private readonly clientUserService: ClientUserService,
        private readonly configService: ConfigService,
    ) {}

    @Post("register")
    @AnonymousAuth()
    @HttpCode(200)
    @ApiOperation({ summary: "用户注册" })
    @ApiResult()
    async register(@Body() dto: RegisterDto, @Req() req: Request): Promise<ResultData> {
        // 解密密码
        if (dto.password) {
            try {
                dto.password = CryptoUtil.decryptPassword(dto.password);
            } catch (error) {
                // 如果解密失败，可能是明文密码，保持原值
                console.warn('Password decryption failed, using original value:', error.message);
            }
        }

        const registerIp = req.ip || (req as any).connection?.remoteAddress;
        const user = await this.clientUserService.register(dto, registerIp);

        // 不返回密码哈希
        const { passwordHash, ...userInfo } = user;

        return ResultData.ok(userInfo, "注册成功");
    }

    @Post("login")
    @AnonymousAuth()
    @HttpCode(200)
    @ApiOperation({ summary: "用户登录" })
    @ApiResult()
    async login(
        @Body() dto: LoginDto, 
        @Req() req: Request, 
        @Res({ passthrough: true }) res: Response
    ): Promise<ResultData> {
        // 解密密码
        if (dto.password) {
            try {
                dto.password = CryptoUtil.decryptPassword(dto.password);
            } catch (error) {
                // 如果解密失败，可能是明文密码，保持原值
                console.warn('Password decryption failed, using original value:', error.message);
            }
        }

        const loginIp = req.ip || (req as any).connection?.remoteAddress;
        const user = await this.clientUserService.login(dto, loginIp);
        const tokens = this.clientUserService.generateTokens(user);

        // 设置 HTTP-Only Cookie
        const cookieOptions = {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'lax' as const,
            domain: this.configService.get('COOKIE_DOMAIN'),
        };

        res.cookie('clientAccessToken', tokens.accessToken, {
            ...cookieOptions,
            maxAge: tokens.expiresIn * 1000,
        });

        res.cookie('clientRefreshToken', tokens.refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
        });

        // 不返回密码哈希
        const { passwordHash, ...userInfo } = user;

        return ResultData.ok(
            {
                user: userInfo,
                tokens: {
                    accessToken: tokens.accessToken,
                    expiresIn: tokens.expiresIn,
                }
            },
            "登录成功",
        );
    }

    @Post("refresh")
    @AnonymousAuth()
    @HttpCode(200)
    @ApiOperation({ summary: "刷新访问令牌" })
    @ApiResult()
    async refreshToken(
        @Req() req: Request, 
        @Res({ passthrough: true }) res: Response
    ): Promise<ResultData> {
        const refreshToken = req.cookies?.clientRefreshToken;
        
        if (!refreshToken) {
            return ResultData.fail(401, 'Refresh token not found');
        }

        const tokens = await this.clientUserService.refreshTokens(refreshToken);
        
        if (!tokens) {
            return ResultData.fail(401, 'Invalid refresh token');
        }

        // 更新 Cookie
        const cookieOptions = {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'lax' as const,
            domain: this.configService.get('COOKIE_DOMAIN'),
        };

        res.cookie('clientAccessToken', tokens.accessToken, {
            ...cookieOptions,
            maxAge: tokens.expiresIn * 1000,
        });

        res.cookie('clientRefreshToken', tokens.refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return ResultData.ok({
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
        }, "令牌刷新成功");
    }

    @Post("logout")
    @ClientUserAuth()
    @HttpCode(200)
    @ApiOperation({ summary: "用户退出登录" })
    @ApiResult()
    async logout(@Res({ passthrough: true }) res: Response): Promise<ResultData> {
        // 清除 Cookie
        const cookieOptions = {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'lax' as const,
            domain: this.configService.get('COOKIE_DOMAIN'),
        };

        res.clearCookie('clientAccessToken', cookieOptions);
        res.clearCookie('clientRefreshToken', cookieOptions);

        return ResultData.ok(null, "退出成功");
    }

    @Get("profile")
    @ClientUserAuth()
    @ApiOperation({ summary: "获取当前用户信息" })
    @ApiResult()
    async getProfile(@Req() req: Request): Promise<ResultData> {
        const { userId } = (req as any).clientUser;
        const user = await this.clientUserService.findById(userId);

        if (!user) {
            return ResultData.fail(404, "用户不存在");
        }

        // 不返回密码哈希
        const { passwordHash, ...userInfo } = user;

        return ResultData.ok(userInfo);
    }

    @Get("me")
    @ClientUserAuth()
    @ApiOperation({ summary: "获取当前登录用户基本信息（从JWT解析）" })
    @ApiResult()
    async getCurrentUser(@Req() req: Request): Promise<ResultData> {
        // 直接从JWT解析的用户信息中获取
        const clientUser = (req as any).clientUser;
        
        // 返回JWT中解析的基本信息
        const userInfo = {
            userId: clientUser.userId,
            username: clientUser.username,
            userSource: clientUser.userSource,
        };

        // 如果需要完整信息，可以从数据库获取
        if (clientUser.user) {
            const { passwordHash, ...fullUserInfo } = clientUser.user;
            return ResultData.ok(fullUserInfo, "获取用户信息成功");
        }

        return ResultData.ok(userInfo, "获取用户基本信息成功");
    }

    @Get("external-accounts")
    @ClientUserAuth()
    @ApiOperation({ summary: "获取绑定的外部账号列表" })
    @ApiResult()
    async getExternalAccounts(@Req() req: Request): Promise<ResultData> {
        const { userId } = (req as any).clientUser;
        const accounts = await this.clientUserService.getExternalAccounts(userId);

        return ResultData.ok(accounts);
    }
}

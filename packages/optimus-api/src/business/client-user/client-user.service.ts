import { Injectable, Logger, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { ClientUserEntity } from "./entities/client-user.entity";
import { ClientUserExternalAccountEntity } from "./entities/client-user-external-account.entity";
import { UserStatus } from "./enums/user-status.enum";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

export interface ClientUserTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/** 跨服务查询的资料档位。basic 是"显示这个人是谁"，full 额外含联系方式与注册时间 */
export type PublicProfileLevel = "basic" | "full";

/**
 * 跨服务可见的用户资料字段**白名单**。
 *
 * 用白名单而不是"排除 passwordHash 后其余全给"（自查接口 `/client-user/profile`
 * 就是后者）：entity 未来新增字段时，白名单方式下默认不外泄，要不要给必须有人
 * 显式决定；黑名单方式下新字段会在没人注意的情况下直接暴露出去。
 *
 * **phone 两档都不给。** 它既是登录标识也是短信/二次验证的落点，敏感度高于邮箱，
 * 而 spec 列的字段集里也没有它。真出现需求时应该单独开一个 grant，
 * 而不是塞进 full 里搭车。
 */
export const PUBLIC_PROFILE_FIELDS: Record<PublicProfileLevel, readonly (keyof ClientUserEntity)[]> = {
    // username 必须在 basic 里：本能力的由来就是业务方各自冗余存一份会漂移的
    // username 快照（partner_profile.username），不给它等于没解决那个问题
    basic: ["userId", "username", "nickname", "avatar"],
    full: ["userId", "username", "nickname", "avatar", "email", "status", "createdAt"],
};

export type PublicProfile = Partial<Pick<ClientUserEntity, (typeof PUBLIC_PROFILE_FIELDS)["full"][number]>>;

@Injectable()
export class ClientUserService {
    private readonly logger = new Logger(ClientUserService.name);
    private readonly SALT_ROUNDS = 10;

    constructor(
        @InjectRepository(ClientUserEntity)
        private readonly userRepository: Repository<ClientUserEntity>,
        @InjectRepository(ClientUserExternalAccountEntity)
        private readonly externalAccountRepository: Repository<ClientUserExternalAccountEntity>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * 通过用户ID查询用户
     */
    async findById(userId: string): Promise<ClientUserEntity | null> {
        return this.userRepository.findOne({
            where: { userId },
        });
    }

    /**
     * 按 uid 查询跨服务可见的公开资料。用户不存在返回 null（调用方负责转成 404）。
     *
     * 字段由 `PUBLIC_PROFILE_FIELDS` 白名单决定，且**在 SQL 层就只 select 白名单里
     * 的列**——不是查回整行再删字段。这样即使返回值被谁不小心整个透出去，
     * 也没有多余的东西可泄；passwordHash 根本没离开数据库。
     */
    async findPublicProfileById(userId: string, level: PublicProfileLevel): Promise<PublicProfile | null> {
        const fields = PUBLIC_PROFILE_FIELDS[level];
        if (!fields) throw new BadRequestException(`未知的资料档位: ${level}`);

        const row = await this.userRepository.findOne({
            where: { userId },
            select: [...fields],
        });
        return row ?? null;
    }

    /**
     * 通过用户名查询用户
     */
    async findByUsername(username: string): Promise<ClientUserEntity | null> {
        return this.userRepository.findOne({
            where: { username },
        });
    }

    /**
     * 通过邮箱查询用户
     */
    async findByEmail(email: string): Promise<ClientUserEntity | null> {
        return this.userRepository.findOne({
            where: { email },
        });
    }

    /**
     * 通过手机号查询用户
     */
    async findByPhone(phone: string): Promise<ClientUserEntity | null> {
        return this.userRepository.findOne({
            where: { phone },
        });
    }

    /**
     * 注册新用户（用户名密码方式）
     */
    async register(dto: RegisterDto, registerIp?: string): Promise<ClientUserEntity> {
        // 检查用户名是否已存在
        if (dto.username) {
            const existingUser = await this.findByUsername(dto.username);
            if (existingUser) {
                throw new BadRequestException("用户名已存在");
            }
        }

        // 检查邮箱是否已存在
        if (dto.email) {
            const existingEmail = await this.findByEmail(dto.email);
            if (existingEmail) {
                throw new BadRequestException("邮箱已被使用");
            }
        }

        // 检查手机号是否已存在
        if (dto.phone) {
            const existingPhone = await this.findByPhone(dto.phone);
            if (existingPhone) {
                throw new BadRequestException("手机号已被使用");
            }
        }

        // 哈希密码
        let passwordHash: string | null = null;
        if (dto.password) {
            passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
        }

        // 创建用户
        const user = this.userRepository.create({
            username: dto.username,
            email: dto.email,
            phone: dto.phone,
            passwordHash,
            nickname: dto.nickname || dto.username,
            registerSource: "direct",
            registerIp,
            status: UserStatus.ACTIVE,
        });

        return this.userRepository.save(user);
    }

    /**
     * 用户登录（用户名密码方式）
     */
    async login(dto: LoginDto, loginIp?: string): Promise<ClientUserEntity> {
        // 查找用户（支持用户名、邮箱、手机号登录）
        let user: ClientUserEntity | null = null;

        if (dto.username) {
            user = await this.findByUsername(dto.username);
        } else if (dto.email) {
            user = await this.findByEmail(dto.email);
        } else if (dto.phone) {
            user = await this.findByPhone(dto.phone);
        }

        if (!user) {
            throw new UnauthorizedException("用户名或密码错误");
        }

        // 检查用户状态
        if (user.status === UserStatus.BANNED) {
            throw new UnauthorizedException("账号已被封禁");
        }

        if (user.status === UserStatus.INACTIVE) {
            throw new UnauthorizedException("账号未激活");
        }

        // 验证密码
        if (!user.passwordHash || !dto.password) {
            throw new UnauthorizedException("用户名或密码错误");
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException("用户名或密码错误");
        }

        // 更新最后登录信息
        user.lastLoginAt = new Date();
        user.lastLoginIp = loginIp || null;
        await this.userRepository.save(user);

        return user;
    }

    /**
     * 通过外部账号查询或创建用户
     * 用于第三方登录（如 WeMade）
     */
    async findOrCreateByExternalAccount(
        platform: string,
        externalUserId: string,
        externalData?: {
            username?: string;
            email?: string;
            avatar?: string;
        },
    ): Promise<ClientUserEntity> {
        // 查找是否已绑定
        const externalAccount = await this.externalAccountRepository.findOne({
            where: {
                platform,
                externalUserId,
            },
            relations: ["user"],
        });

        if (externalAccount) {
            return externalAccount.user;
        }

        // 创建新用户
        const user = this.userRepository.create({
            username: externalData?.username || `${platform}_${externalUserId}`,
            email: externalData?.email,
            avatar: externalData?.avatar,
            nickname: externalData?.username,
            registerSource: platform,
            status: UserStatus.ACTIVE,
        });

        const savedUser = await this.userRepository.save(user);

        // 创建外部账号绑定
        const newExternalAccount = this.externalAccountRepository.create({
            userId: savedUser.userId,
            platform,
            externalUserId,
            externalUsername: externalData?.username,
            externalEmail: externalData?.email,
            externalAvatar: externalData?.avatar,
            isPrimary: true,
        });

        await this.externalAccountRepository.save(newExternalAccount);

        return savedUser;
    }

    /**
     * 绑定外部账号
     */
    async bindExternalAccount(
        userId: string,
        platform: string,
        externalUserId: string,
        externalData?: {
            username?: string;
            email?: string;
            avatar?: string;
        },
    ): Promise<ClientUserExternalAccountEntity> {
        // 检查用户是否存在
        const user = await this.findById(userId);
        if (!user) {
            throw new BadRequestException("用户不存在");
        }

        // 检查是否已绑定此平台
        const existing = await this.externalAccountRepository.findOne({
            where: {
                userId,
                platform,
            },
        });

        if (existing) {
            throw new BadRequestException("已绑定此平台账号");
        }

        // 检查外部账号是否已被其他用户绑定
        const existingExternal = await this.externalAccountRepository.findOne({
            where: {
                platform,
                externalUserId,
            },
        });

        if (existingExternal) {
            throw new BadRequestException("此外部账号已被其他用户绑定");
        }

        // 创建绑定
        const externalAccount = this.externalAccountRepository.create({
            userId,
            platform,
            externalUserId,
            externalUsername: externalData?.username,
            externalEmail: externalData?.email,
            externalAvatar: externalData?.avatar,
        });

        return this.externalAccountRepository.save(externalAccount);
    }

    /**
     * 解绑外部账号
     */
    async unbindExternalAccount(userId: string, platform: string): Promise<void> {
        const result = await this.externalAccountRepository.delete({
            userId,
            platform,
        });

        if (result.affected === 0) {
            throw new BadRequestException("未找到绑定记录");
        }
    }

    /**
     * 获取用户的所有外部账号绑定
     */
    async getExternalAccounts(userId: string): Promise<ClientUserExternalAccountEntity[]> {
        return this.externalAccountRepository.find({
            where: { userId },
        });
    }

    /**
     * 生成客户端用户 JWT Token
     */
    generateTokens(user: ClientUserEntity): ClientUserTokens {
        const payload = {
            sub: user.userId,
            username: user.username,
            type: 'client_user'
        };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('CLIENT_USER_JWT_EXPIRES_IN', '2h'),
        });

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('CLIENT_USER_REFRESH_EXPIRES_IN', '7d'),
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: 2 * 60 * 60, // 2小时（秒）
        };
    }

    /**
     * 验证客户端用户 JWT Token
     */
    async verifyToken(token: string): Promise<ClientUserEntity | null> {
        try {
            const payload = this.jwtService.verify(token);
            
            if (payload.type !== 'client_user') {
                return null;
            }

            const user = await this.findById(payload.sub);
            
            if (!user || user.status !== UserStatus.ACTIVE) {
                return null;
            }

            return user;
        } catch (error) {
            return null;
        }
    }

    /**
     * 刷新 Token
     */
    async refreshTokens(refreshToken: string): Promise<ClientUserTokens | null> {
        try {
            const payload = this.jwtService.verify(refreshToken);
            
            if (payload.type !== 'client_user') {
                return null;
            }

            const user = await this.findById(payload.sub);
            
            if (!user || user.status !== UserStatus.ACTIVE) {
                return null;
            }

            return this.generateTokens(user);
        } catch (error) {
            return null;
        }
    }
}

import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, getManager, getConnection, In } from "typeorm";
import { classToPlain, plainToClass } from "class-transformer";
import { genSalt, hash, compare, genSaltSync, hashSync } from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import xlsx from "node-xlsx";
import { pick as _pick } from "lodash";
import ms from "ms";

import { RoleService } from "../role/role.service";
import { BaseService } from "./base.service";
import { ResultData } from "../../shared/utils/result";
import { AppHttpCode } from "../../shared/enums/code.enum";
import { validPhone, validEmail } from "../../shared/utils/validate";
import { UserType } from "../../shared/enums/user.enum";

import { UserEntity, UserDeleted } from "./user.entity";
import { UserRoleEntity } from "./user-role.entity";
import { RoleEntity } from "../role/entities/role.entity";

import { CreateUserDto } from "./dto/create-user.dto";
import { FindUserListDto } from "./dto/find-user-list.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateOrUpdateUserRolesDto } from "./dto/create-user-roles.dto";
import { CreateTokenDto } from "./dto/create-token.dto";
import { LoginUser } from "./dto/login-user.dto";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(UserRoleEntity)
        private readonly userRoleRepo: Repository<UserRoleEntity>,
        @InjectRepository(RoleEntity)
        private readonly roleRepo: Repository<RoleEntity>,
        @Inject(RoleService)
        private readonly roleService: RoleService,
        private readonly config: ConfigService,
        private readonly baseService: BaseService,
        private readonly jwtService: JwtService,
    ) {}

    async findOneById(id: string): Promise<UserEntity> {
        let user = await this.userRepo.findOne({ id, isDeleted: UserDeleted.NO });
        user = plainToClass(UserEntity, { ...user }, { enableImplicitConversion: true });
        user.password = "";
        user.salt = "";
        return user;
    }

    findOneByAccount(account: string): Promise<UserEntity> {
        return this.userRepo.findOne({ account });
    }

    /** 创建用户 */
    async create(dto: CreateUserDto): Promise<ResultData> {
        // 防止重复创建 start
        if (await this.findOneByAccount(dto.account))
            return ResultData.fail(AppHttpCode.USER_CREATE_EXISTING, "帐号已存在，请调整后重新注册！");
        if (await this.userRepo.findOne({ phoneNum: dto.phoneNum }))
            return ResultData.fail(AppHttpCode.USER_CREATE_EXISTING, "当前手机号已存在，请调整后重新注册");
        if (await this.userRepo.findOne({ email: dto.email }))
            return ResultData.fail(AppHttpCode.USER_CREATE_EXISTING, "当前邮箱已存在，请调整后重新注册");
        // 防止重复创建 end
        const salt = await genSalt();
        dto.password = await hash(dto.password, salt);
        // plainToClass  忽略转换 @Exclude 装饰器
        const user = plainToClass(UserEntity, { salt, ...dto }, { ignoreDecorators: true });
        const result = await getManager().transaction(async (transactionalEntityManager) => {
            return await transactionalEntityManager.save<UserEntity>(user);
        });
        return ResultData.ok(classToPlain(result));
    }

    /**
     * 根据 USERID 虚拟删除用户
     * @param userId
     * @returns
     */
    async delete(userId: string): Promise<ResultData> {
        const user = await this.userRepo.findOne({ id: userId, isDeleted: UserDeleted.NO });
        if (!user) {
            return ResultData.fail(AppHttpCode.USER_NOT_FOUND, "当前用户已被删除或不存在");
        }
        user.isDeleted = UserDeleted.YES;
        user.deletedDate = new Date();
        await this.userRepo.save(user);
        return ResultData.ok({});
    }

    /**
     * 根据 User Id 获取角色信息
     * @param userId
     * @returns
     */
    private getRoleByUserId(userId: string) {
        return getConnection()
            .createQueryBuilder("op_sys_role", "role")
            .leftJoinAndSelect("op_sys_user_role", "ur", "role.id = ur.role_id")
            .where("ur.user_id = :userId", { userId })
            .getMany();
    }

    /**
     * 登录
     * account 有可能是 帐号/手机/邮箱
     */
    async login(loginUser: LoginUser): Promise<ResultData> {
        const { account, password, captchaId, verifyCode } = loginUser;
        let user = null;
        const isAllowUser = await this.baseService.checkImgCaptcha(captchaId, verifyCode);

        if (!isAllowUser) {
            return ResultData.fail(AppHttpCode.SERVICE_GEN_IMAGE_CAPTCHA_ERROR, "验证码错误");
        }

        const findUser = (where = {}) => {
            return this.userRepo
                .createQueryBuilder("user")
                .where({ ...where, isDeleted: UserDeleted.NO })
                .select([
                    "user.id",
                    "user.fullName",
                    "user.account",
                    "user.phoneNum",
                    "user.status",
                    "user.type",
                    "user.email",
                    "user.avatar",
                    "user.lastLoginTime",
                ])
                .addSelect("user.password")
                .getOne();
        };

        if (validPhone(account)) {
            // 手机登录
            user = await findUser({ phoneNum: account });
        } else if (validEmail(account)) {
            // 邮箱
            user = await findUser({ email: account });
        } else {
            // 帐号
            user = await findUser({ account });
        }

        if (!user) {
            return ResultData.fail(AppHttpCode.USER_PASSWORD_INVALID, "帐号或密码错误");
        }
        const checkPassword = await compare(password, user.password);
        delete user.password;
        if (!checkPassword) {
            return ResultData.fail(AppHttpCode.USER_PASSWORD_INVALID, "帐号或密码错误");
        }
        if (user.status === 0) {
            return ResultData.fail(AppHttpCode.USER_ACCOUNT_FORBIDDEN, "您已被禁用，如需正常使用请联系管理员");
        }

        const data = this.genToken({ id: user.id });
        // 获取角色 IDS
        const roleIds = await this.roleService.findRoleIdsByUserId(user.id);

        await this.userRepo.update(user.id, {
            lastLoginTime: new Date(),
        });

        return ResultData.ok({
            accessToken: data.accessToken,
            user: Object.assign({ roleIds }, user),
        });
    }

    async updateToken(userId: string): Promise<ResultData> {
        const data = this.genToken({ id: userId });
        return ResultData.ok(data);
    }

    /**
     * 批量导入用户
     */
    async importUsers(file: Express.Multer.File): Promise<ResultData> {
        const acceptFileType =
            "application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        if (!acceptFileType.indexOf(file.mimetype)) {
            return ResultData.fail(AppHttpCode.FILE_TYPE_ERROR, "文件类型错误，请上传 .xls 或 .xlsx 文件");
        }

        if (file.size > 5 * 1024 * 1024) {
            return ResultData.fail(AppHttpCode.FILE_SIZE_EXCEED_LIMIT, "文件大小超过，最大支持 5M");
        }

        const workSheet = xlsx.parse(file.buffer);
        // 需要处理 excel 内帐号 手机号 邮箱 是否有重复的情况
        if (workSheet[0].data.length === 0) {
            return ResultData.fail(AppHttpCode.DATA_IS_EMPTY, "excel 导入数据为空");
        }

        const userArr = [];
        const accountMap = new Map();
        const phoneMap = new Map();
        const emailMap = new Map();
        // 从 1 开始是去掉 excel 帐号等文字提示
        for (let i = 1, len = workSheet[0].data.length; i < len; i++) {
            const dataArr = workSheet[0].data[i];
            if (dataArr.length === 0) break;
            const [account, phone, email, avatar] = dataArr;
            userArr.push({ account, phoneNum: phone, email, avatar });
            if (account && !accountMap.has(account)) {
                accountMap.set(account, []);
            } else if (account) {
                // 有重复的
                accountMap.get(account).push(i + 1);
            } else {
                return ResultData.fail(AppHttpCode.DATA_IS_EMPTY, "上传文件帐号有空数据，请检查后再导入");
            }
            if (!phoneMap.has(phone)) {
                phoneMap.set(phone, []);
            } else if (phone) {
                phoneMap.get(phone).push(i + 1);
            }
            if (email && !emailMap.has(email)) {
                emailMap.set(email, []);
            } else if (email) {
                emailMap.get(email).push(i + 1);
            }
        }
        const accountErrArr = [];
        for (const [key, val] of accountMap) {
            if (val.length > 0) {
                accountErrArr.push({ key, val });
            }
        }
        const phoneErrArr = [];
        for (const [key, val] of phoneMap) {
            if (val.length > 0) {
                phoneErrArr.push({ key, val });
            }
        }
        const emailErrArr = [];
        for (const [key, val] of emailMap) {
            if (val.length > 0) {
                emailErrArr.push({ key, val });
            }
        }
        if (accountErrArr.length > 0 || phoneErrArr.length > 0 || emailErrArr.length > 0) {
            return ResultData.fail(
                AppHttpCode.PARAM_INVALID,
                "导入 excel 内部有数据重复或数据有误，请修改调整后上传导入",
                {
                    account: accountErrArr,
                    phone: phoneErrArr,
                    email: emailErrArr,
                },
            );
        }
        // 若 excel 内部无重复，则需要判断 excel 中数据 是否与 数据库的数据重复
        const existingAccount = await this.userRepo.find({
            select: ["account"],
            where: { account: In(userArr.map((v) => v.account)) },
        });
        if (existingAccount.length > 0) {
            existingAccount.forEach((v) => {
                // userArr 中的数据 下标 换算成 excel 中的 行号 + 2
                accountErrArr.push({
                    key: v.account,
                    val: [userArr.findIndex((m) => m.account === v.account) + 2],
                });
            });
        }
        // 手机号、邮箱非必填，所以查询存在重复的 过滤掉 空数据
        const existingPhone = await this.userRepo.find({
            select: ["phoneNum"],
            where: {
                account: In(userArr.map((v) => v.phoneNum).filter((v) => !!v)),
            },
        });
        if (existingPhone.length > 0) {
            existingPhone.forEach((v) => {
                // userArr 中的数据 下标 换算成 excel 中的 行号 + 2
                phoneErrArr.push({
                    key: v.phoneNum,
                    val: [userArr.findIndex((m) => m.phoneNum === v.phoneNum) + 2],
                });
            });
        }
        const existingEmail = await this.userRepo.find({
            select: ["email"],
            where: {
                account: In(userArr.map((v) => v.email).filter((v) => !!v)),
            },
        });
        if (existingEmail.length > 0) {
            existingEmail.forEach((v) => {
                // userArr 中的数据 下标 换算成 excel 中的 行号 + 2
                emailErrArr.push({
                    key: v.email,
                    val: [userArr.findIndex((m) => m.email === v.email) + 2],
                });
            });
        }
        if (accountErrArr.length > 0 || phoneErrArr.length > 0 || emailErrArr.length > 0) {
            return ResultData.fail(AppHttpCode.PARAM_INVALID, "导入 excel 系统中已有重复项，请修改调整后上传导入", {
                account: accountErrArr,
                phone: phoneErrArr,
                email: emailErrArr,
            });
        }
        // excel 与数据库无重复，准备入库
        const password = this.config.get<string>("user.initialPassword");
        userArr.forEach((v) => {
            const salt = genSaltSync();
            const encryptPw = hashSync(password, salt);
            v["password"] = encryptPw;
            v["salt"] = salt;
        });
        console.log("userArr", userArr);
        const result = await getManager().transaction(async (transactionalEntityManager) => {
            return await transactionalEntityManager.save<UserEntity>(
                plainToClass(UserEntity, userArr, {
                    ignoreDecorators: true,
                }),
            );
        });
        return ResultData.ok(classToPlain(result));
    }

    /** 更新用户信息 */
    async update(dto: UpdateUserDto): Promise<ResultData> {
        const existing = await this.findOneById(dto.id);
        if (!existing) return ResultData.fail(AppHttpCode.USER_NOT_FOUND, "当前用户不存在或已删除");
        if (existing.status === 0)
            return ResultData.fail(AppHttpCode.USER_ACCOUNT_FORBIDDEN, "当前用户已被禁用，不可更新用户信息");
        const roleIds = dto.roleIds || [];
        const userInfo = classToPlain(dto);
        delete userInfo.roleIds;
        const { affected } = await getManager().transaction(async (transactionalEntityManager) => {
            await this.createOrUpdateUserRole({ userId: dto.id, roleIds });
            return await transactionalEntityManager.update<UserEntity>(UserEntity, dto.id, userInfo);
        });
        if (!affected) ResultData.fail(AppHttpCode.SERVICE_ERROR, "更新失败，请稍后重试");

        return ResultData.ok();
    }

    /**
     * 启用 / 禁用 用户
     * @param userId
     * @param status
     * @returns
     */
    async updateStatus(userId: string, status: 0 | 1, currUserId: string): Promise<ResultData> {
        if (userId === currUserId)
            return ResultData.fail(AppHttpCode.USER_FORBIDDEN_UPDATE, "当前登录用户状态不可更改");
        const existing = await this.findOneById(userId);
        if (!existing) ResultData.fail(AppHttpCode.USER_NOT_FOUND, "当前用户不存在或已删除");
        if (existing.type === UserType.SUPER_ADMIN)
            return ResultData.fail(AppHttpCode.USER_FORBIDDEN_UPDATE, "超管帐号状态禁止更改");
        const { affected } = await getManager().transaction(async (transactionalEntityManager) => {
            return await transactionalEntityManager.update<UserEntity>(UserEntity, userId, { id: userId, status });
        });
        if (!affected) ResultData.fail(AppHttpCode.SERVICE_ERROR, "更新失败，请稍后尝试");

        return ResultData.ok();
    }

    async changePasswordByOldPassword(userId: string, oldPassword: string, newPassword: string): Promise<ResultData> {
        const { isExisting, data, code, message } = await this._checkUser(userId);

        if (!isExisting) {
            return ResultData.fail(code, message);
        }

        const isEqual = await compare(oldPassword, data.password);

        if (!isEqual) {
            return ResultData.fail(AppHttpCode.USER_PASSWORD_INVALID, "原始密码不正确");
        }

        // 防止重复创建 end
        const salt = await genSalt();
        data.password = await hash(newPassword, salt);
        data.salt = salt;

        const user = plainToClass(UserEntity, { ...data }, { ignoreDecorators: true });
        const result = await getManager().transaction(async (transactionalEntityManager) => {
            return await transactionalEntityManager.save<UserEntity>(user);
        });

        return ResultData.ok(classToPlain(result));
    }

    /**
     * 更新或重置用户密码
     * @reset 是否重置, false 则使用传入的 password 更新
     */
    async updatePassword(userId: string, password: string, reset: boolean): Promise<ResultData> {
        const { isExisting, data: userData, code, message } = await this._checkUser(userId);

        if (!isExisting) {
            return ResultData.fail(code, message);
        }

        if (userData.status === 0) {
            return ResultData.fail(AppHttpCode.USER_ACCOUNT_FORBIDDEN, "当前用户已被禁用，不可重置用户密码");
        }

        const newPassword = reset ? this.config.get<string>("user.initialPassword") : password;
        const user = {
            id: userId,
            password: await hash(newPassword, userData.salt),
        };
        const { affected } = await getManager().transaction(async (transactionalEntityManager) => {
            return await transactionalEntityManager.update<UserEntity>(UserEntity, userId, user);
        });
        if (!affected) {
            ResultData.fail(AppHttpCode.SERVICE_ERROR, `${reset ? "重置" : "更新"}失败，请稍后重试`);
        }
        return ResultData.ok();
    }

    /**
     * 检验用户是不存在
     * @param userId
     * @returns
     */
    private async _checkUser(userId: string) {
        const user = await this.userRepo
            .createQueryBuilder("user")
            .where({ id: userId })
            .select([
                "user.id",
                "user.account",
                "user.fullName",
                "user.phoneNum",
                "user.email",
                "user.status",
                "user.avatar",
                "user.type",
            ])
            .addSelect("user.password")
            .addSelect("user.salt")
            .getOne();

        return {
            isExisting: Boolean(user),
            data: user,
            code: AppHttpCode.USER_NOT_FOUND,
            message: "用户不存在或已删除，操作失败",
        };
    }

    /** 创建 or 更新用户-角色 */
    async createOrUpdateUserRole(dto: CreateOrUpdateUserRolesDto): Promise<ResultData> {
        const userRoleList = plainToClass(
            UserRoleEntity,
            dto.roleIds.map((roleId) => {
                return { roleId, userId: dto.userId };
            }),
        );
        const res = await getManager().transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.delete(UserRoleEntity, {
                userId: dto.userId,
            });
            return await transactionalEntityManager.save<UserRoleEntity>(userRoleList);
        });
        if (!res) {
            return ResultData.fail(AppHttpCode.SERVICE_ERROR, "用户更新角色失败");
        }

        return ResultData.ok();
    }

    /** 查询用户列表 */
    async findList(dto: FindUserListDto): Promise<ResultData> {
        const { page, size, account, fullName, status, roleId } = dto;
        const selectFields = [
            "su.id",
            "su.fullName",
            "su.account",
            "su.phoneNum",
            "su.email",
            "su.status",
            "su.avatar",
            "su.type",
            "su.lastLoginTime",
        ];
        const where: any = {
            // 没有删除过的
            isDeleted: UserDeleted.NO,
        };
        status && (where.status = status);
        account && (where.account = Like(`%${account}%`));
        fullName && (where.fullName = Like(`%${fullName}%`));

        const connection = getConnection()
            .createQueryBuilder("op_sys_user", "su")
            .select(selectFields)
            .leftJoinAndSelect("op_sys_user_role", "sur", "sur.user_id = su.id")
            .leftJoinAndMapMany("su.roles", "op_sys_role", "sr", "sr.id = sur.role_id");

        if (roleId) {
            connection.where("sur.role_id = :roleId", { roleId });
        }

        const [list, total] = await connection
            .andWhere(where)
            .orderBy("su.id", "DESC")
            .skip(size * page)
            .take(size)
            .getManyAndCount();

        return ResultData.ok({ list, total });
    }

    /** 查询单个用户 */
    async findOne(id: string): Promise<ResultData> {
        const user = await this.findOneById(id);
        if (!user) {
            return ResultData.fail(AppHttpCode.USER_NOT_FOUND, "该用户不存在或已删除");
        }
        return ResultData.ok(classToPlain(user));
    }

    /** 查询单个用户所拥有的角色 id */
    async findUserRole(id: string): Promise<ResultData> {
        const roleIds = await this.findUserRoleByUserId(id);
        return ResultData.ok(roleIds);
    }

    /** 生成用户角色关系, 单个角色， 多个用户 */
    async createOrCancelUserRole(
        userIds: string[],
        roleId: string,
        createOrCancel: "create" | "cancel",
    ): Promise<ResultData> {
        const res = await getManager().transaction(async (transactionalEntityManager) => {
            if (createOrCancel === "create") {
                const dto = plainToClass(
                    UserRoleEntity,
                    userIds.map((userId) => {
                        return { roleId, userId };
                    }),
                );
                return await transactionalEntityManager.save<UserRoleEntity>(dto);
            } else {
                return await transactionalEntityManager.delete(UserRoleEntity, { roleId, userId: userIds });
            }
        });
        if (res) {
            return ResultData.ok();
        } else
            return ResultData.fail(
                AppHttpCode.SERVICE_ERROR,
                `${createOrCancel === "create" ? "添加" : "取消"}用户关联失败`,
            );
    }

    /**
     * @param roleId 角色 id
     * @param isCorrelation 是否相关联， true 查询拥有当前 角色的用户， false 查询无当前角色的用户
     */
    private async findUserByRoleId(
        roleId: string,
        page: number,
        size: number,
        isCorrelation: boolean,
    ): Promise<ResultData> {
        let res;
        if (isCorrelation) {
            res = await getConnection()
                .createQueryBuilder("op_sys_user", "su")
                .leftJoinAndSelect("op_sys_user_role", "ur", "ur.user_id = su.id")
                .where("su.status = 1 and ur.role_id = :roleId", { roleId })
                .skip(size * page)
                .take(size)
                .getManyAndCount();
        } else {
            res = await getConnection()
                .createQueryBuilder("op_sys_user", "su")
                .where((qb: any) => {
                    const subQuery = qb
                        .subQuery()
                        .select(["sur.user_id"])
                        .from("op_sys_user_role", "sur")
                        .where("sur.role_id = :roleId", { roleId })
                        .getQuery();
                    return `su.status = 1 and su.id not in ${subQuery}`;
                })
                .skip(size * page)
                .take(size)
                .getManyAndCount();
        }
        return ResultData.ok({ list: classToPlain(res[0]), total: res[1] });
    }

    /** 根据用户id 查询角色 id 集合 */
    async findUserRoleByUserId(id: string): Promise<number[]> {
        const roles = await this.userRoleRepo.find({
            select: ["roleId"],
            where: { userId: id },
        });
        const roleIds = roles.map((v) => v.roleId);
        return roleIds;
    }

    /**
     * 生成 token 与 刷新 token
     * @param payload
     * @returns
     */
    genToken(payload: { id: string }): CreateTokenDto {
        const accessToken = `Bearer ${this.jwtService.sign(payload)}`;
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.config.get("jwt.refreshExpiresIn"),
        });
        return { accessToken, refreshToken };
    }

    /**
     * 生成刷新 token
     */
    refreshToken(id: string): string {
        return this.jwtService.sign({ id });
    }

    /** 校验 token */
    verifyToken(token: string): string {
        try {
            if (!token) return null;
            const id = this.jwtService.verify(token.replace("Bearer ", ""));
            return id;
        } catch (error) {
            return null;
        }
    }
}

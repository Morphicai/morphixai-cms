import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";

import { UserType, UserStatus } from "../../shared/enums/user.enum";

export enum UserDeleted {
    NO = 1,
    YES = 0,
}

@Entity("sys_user")
export class UserEntity {
    @ApiProperty({ type: String, description: "id" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: string;

    @Exclude({ toPlainOnly: true }) // 输出屏蔽密码
    @Column({
        type: "varchar",
        length: 200,
        nullable: false,
        comment: "用户登录密码",
        select: false,
    })
    public password: string;

    @Exclude({ toPlainOnly: true }) // 输出屏蔽盐
    @Column({ type: "varchar", length: 200, nullable: false, select: false, comment: "盐" })
    public salt: string;

    @Column({ type: "varchar", name: "full_name", length: 30, nullable: true })
    public fullName: string;

    @ApiProperty({ type: String, description: "用户登录账号" })
    @Column({ type: "varchar", length: 32, comment: "用户登录账号" })
    public account: string;

    @ApiProperty({ type: String, description: "手机号" })
    @Column({
        type: "varchar",
        name: "phone_num",
        default: "",
        length: 20,
        comment: "用户手机号码",
    })
    public phoneNum: string;

    @ApiProperty({ type: String, description: "邮箱" })
    @Column({ type: "varchar", comment: "邮箱地址", default: "" })
    public email: string;

    @ApiProperty({ type: String, description: "所属状态: 1-有效，0-禁用" })
    @Column({
        type: "tinyint",
        default: 1,
        comment: "所属状态: 1-有效，0-禁用",
    })
    public status: UserStatus;

    @ApiProperty({ type: String, description: "所属状态: 1-有效，0-已经被虚拟删除" })
    @Column({
        type: "tinyint",
        default: 1,
        name: "is_deleted",
        select: false,
        comment: "所属状态: 1-有效，0-已经被虚拟删除",
    })
    public isDeleted: UserDeleted;

    @UpdateDateColumn({
        type: "timestamp",
        name: "deleted_date",
        select: false,
        comment: "删除时间",
    })
    deletedDate: Date;

    @ApiProperty({ type: String, description: "头像url" })
    @Column({ type: "varchar", comment: "头像地址" })
    public avatar: string;

    @ApiProperty({ type: Number, description: "帐号类型：0-超管， 1-普通用户" })
    @Column({
        type: "tinyint",
        default: 1,
        comment: "帐号类型：0-超管， 1-普通用户",
    })
    public type: UserType;

    @ApiProperty({ type: Date, description: "创建时间" })
    @CreateDateColumn({
        type: "timestamp",
        name: "create_date",
        comment: "创建时间",
    })
    createDate: Date;

    @ApiProperty({ type: Date, description: "更新时间" })
    @UpdateDateColumn({
        type: "timestamp",
        name: "update_date",
        comment: "更新时间",
    })
    updateDate: Date;

    @Column({
        type: "timestamp",
        name: "last_login_time",
        comment: "最后一次登录时间",
        nullable: true,
    })
    lastLoginTime: Date;
}

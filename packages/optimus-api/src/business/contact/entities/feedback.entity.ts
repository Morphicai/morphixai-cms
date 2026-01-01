import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail } from "class-validator";
import { Exclude } from "class-transformer";

@Entity("biz_feedback")
export class FeedbackEntity {
    @ApiProperty({ description: "id" })
    @Exclude({ toPlainOnly: true })
    @PrimaryGeneratedColumn({ type: "bigint" })
    readonly id: number;

    @ApiProperty({ description: "Email" })
    @IsEmail()
    @Column({ type: "varchar", comment: "邮箱" })
    readonly email: string;

    @ApiProperty({ type: String, description: "昵称" })
    @Column({
        type: "varchar",
        name: "nick_name",
        default: "",
        length: 30,
        comment: "昵称",
    })
    readonly nickName: string;

    @ApiProperty({ description: "地址" })
    @IsString({ message: "message 类型错误，正确类型 string" })
    @Column({ type: "varchar", default: "", length: 200, comment: "意见信息" })
    readonly message: string;

    @ApiProperty({ description: "提交时间" })
    @CreateDateColumn({ type: "timestamp", name: "create_date", comment: "创建时间" })
    readonly createDate: Date;
}

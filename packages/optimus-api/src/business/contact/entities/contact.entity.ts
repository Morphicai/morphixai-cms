import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail } from "class-validator";

@Entity("op_biz_contact")
export class ContactEntity {
    @ApiProperty({ description: "id" })
    @PrimaryGeneratedColumn({ type: "bigint" })
    public id: number;

    @ApiProperty({ description: "Email" })
    @IsEmail()
    @Column({ type: "varchar", comment: "邮箱" })
    public email: string;

    @ApiProperty({ type: String, description: "手机号" })
    @Column({
        type: "varchar",
        name: "phone_num",
        default: "",
        length: 20,
        comment: "用户手机号码",
    })
    public phoneNum: string;

    @ApiProperty({ description: "地址" })
    @IsString({ message: "engAddress 类型错误，正确类型 string" })
    @Column({ type: "varchar", comment: "地址" })
    public address: string;

    @ApiProperty({ description: "英文地址" })
    @IsString({ message: "engAddress 类型错误，正确类型 string" })
    @Column({ type: "varchar", name: "eng_address", default: "", comment: "英文地址" })
    public engAddress: string;
}

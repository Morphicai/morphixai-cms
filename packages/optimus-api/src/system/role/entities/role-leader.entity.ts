import { Entity, PrimaryGeneratedColumn, JoinColumn, Column, ManyToOne } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { RoleEntity } from "./role.entity";

@Entity("sys_role_leader")
export class RoleLeaderEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    readonly id: number;

    @Column({ type: "bigint", name: "role_id", comment: "role id" })
    roleId: string;

    @ApiProperty({ description: "对应角色下的 Leader，可以有多个（userId）" })
    @Column({ type: "bigint", name: "leader_id", unique: true, comment: "leader id(userId)" })
    leaderId: number;
}

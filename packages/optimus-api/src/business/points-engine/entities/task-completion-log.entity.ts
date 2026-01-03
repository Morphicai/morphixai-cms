import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";
import { TaskType } from "../enums/task-type.enum";
import { TaskStatus } from "../enums/task-status.enum";

@Entity("biz_task_completion_log")
// 注意：复合索引已包含 partnerId，无需单独为 partnerId 创建索引
@Index(["taskCode", "partnerId", "eventId"], { unique: true })
export class TaskCompletionLogEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string;

    @Column({ type: "varchar", length: 64, name: "task_code" })
    taskCode: string;

    @Column({
        type: "enum",
        enum: TaskType,
        name: "task_type",
    })
    taskType: TaskType;

    @Column({ type: "bigint", name: "partner_id" })
    partnerId: string;

    @Column({ type: "varchar", length: 100, name: "uid" })
    uid: string;

    @Column({ type: "bigint", nullable: true, name: "related_partner_id" })
    relatedPartnerId: string | null;

    @Column({ type: "varchar", length: 100, nullable: true, name: "related_uid" })
    relatedUid: string | null;

    @Column({ type: "varchar", length: 64, name: "event_type" })
    eventType: string;

    @Column({ type: "varchar", length: 128, name: "event_id" })
    eventId: string;

    @Column({ type: "json", nullable: true, name: "business_params" })
    businessParams: Record<string, any> | null;

    @Column({
        type: "enum",
        enum: TaskStatus,
        default: TaskStatus.COMPLETED,
    })
    status: TaskStatus;

    @CreateDateColumn({ type: "timestamp", name: "created_at" })
    createdAt: Date;
}

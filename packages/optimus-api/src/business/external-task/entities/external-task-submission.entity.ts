import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { ExternalTaskType } from "../enums/external-task-type.enum";
import { SubmissionStatus } from "../enums/submission-status.enum";

@Entity("biz_external_task_submission")
@Index(["partnerId"])
@Index(["status"])
@Index(["taskType"])
@Index(["createdAt"])
export class ExternalTaskSubmissionEntity {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string;

    @Column({ type: "varchar", length: 64, name: "submission_code", unique: true })
    submissionCode: string;

    @Column({
        type: "enum",
        enum: ExternalTaskType,
        name: "task_type",
    })
    taskType: ExternalTaskType;

    @Column({ type: "bigint", name: "partner_id" })
    partnerId: string;

    @Column({ type: "varchar", length: 100, name: "uid" })
    uid: string;

    @Column({ type: "varchar", length: 500, nullable: true, name: "task_link" })
    taskLink: string | null;

    @Column({ type: "json", nullable: true, name: "proof_images" })
    proofImages: string[] | null;

    @Column({ type: "text", nullable: true })
    remark: string | null;

    @Column({
        type: "enum",
        enum: SubmissionStatus,
        default: SubmissionStatus.PENDING,
    })
    status: SubmissionStatus;

    @Column({ type: "bigint", nullable: true, name: "reviewer_id" })
    reviewerId: string | null;

    @Column({ type: "timestamp", nullable: true, name: "review_time" })
    reviewTime: Date | null;

    @Column({ type: "text", nullable: true, name: "review_remark" })
    reviewRemark: string | null;

    @Column({ type: "int", nullable: true, name: "points_awarded" })
    pointsAwarded: number | null;

    @Column({ type: "bigint", nullable: true, name: "task_log_id" })
    taskLogId: string | null;

    @CreateDateColumn({ type: "timestamp", name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
    updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

/**
 * 服务事件表——事务性 outbox。
 * 事件与业务写库同库,发事件不引 broker;表本身就是持久化日志,
 * 消费靠自增 id 游标轮询。将来引 NATS 时这张表升级为 relay 源,语义不变。
 */
@Entity("op_sys_service_event")
@Index(["type"])
export class ServiceEventEntity {
    // bigint 自增:id 同时是消费游标,单调递增是语义的一部分
    @PrimaryGeneratedColumn({ type: "bigint", comment: "主键ID,兼作消费游标" })
    id: number;

    @Column({ length: 50, comment: "事件来源服务(slug)" })
    source: string;

    @Column({ length: 100, comment: "事件类型,如 agent.run.finished" })
    type: string;

    @Column({ type: "json", nullable: true, comment: "事件载荷" })
    payload: any;

    // 服务端从 token 主体记录,不信任 body 自报——伪造事件能查到发件人
    @Column({ length: 50, nullable: true, comment: "发起人账号(服务端记录)" })
    by: string;

    @CreateDateColumn({ name: "created_at", comment: "创建时间" })
    createdAt: Date;
}

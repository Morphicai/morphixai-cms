import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";
import { ServiceEventEntity } from "./entities/service-event.entity";

const SLUG_RE = /^[a-z][a-z0-9-]{0,49}$/;
// type 允许点分层级(agent.run.finished),source 只是 slug
const TYPE_RE = /^[a-z][a-z0-9.-]{0,99}$/;
const MAX_PAYLOAD_BYTES = 4096;

/**
 * 服务事件——发与查。
 * 两种读法刻意分开:带 after 是消费者语义(游标向后,升序,不漏不重);
 * 不带 after 是面板语义(最近 N 条,降序)。别合成一个排序参数,会有人用错。
 */
@Injectable()
export class ServiceEventService {
    constructor(
        @InjectRepository(ServiceEventEntity)
        private readonly repo: Repository<ServiceEventEntity>,
    ) {}

    async emit(source: string, type: string, payload: unknown, by?: string): Promise<ServiceEventEntity> {
        if (!SLUG_RE.test(source)) throw new BadRequestException("source 需为小写 slug(≤50字)");
        if (!TYPE_RE.test(type)) throw new BadRequestException("type 需为小写点分标识(≤100字)");
        if (payload !== undefined && payload !== null) {
            // 事件是信号不是数据通道,大对象应该存业务表后在 payload 里放引用
            if (Buffer.byteLength(JSON.stringify(payload)) > MAX_PAYLOAD_BYTES) {
                throw new BadRequestException(`payload 超过 ${MAX_PAYLOAD_BYTES} 字节,请传引用而非数据本体`);
            }
        }
        return this.repo.save(this.repo.create({ source, type, payload: payload ?? null, by }));
    }

    async query(opts: { after?: number; type?: string; limit?: number }): Promise<ServiceEventEntity[]> {
        const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
        const where: Record<string, unknown> = {};
        if (opts.type) where.type = opts.type;
        if (opts.after !== undefined && opts.after !== null) {
            where.id = MoreThan(opts.after);
            return this.repo.find({ where, order: { id: "ASC" }, take: limit });
        }
        return this.repo.find({ where, order: { id: "DESC" }, take: limit });
    }
}

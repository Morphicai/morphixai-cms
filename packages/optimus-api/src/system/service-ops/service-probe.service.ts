import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DictionaryEntity, DictionaryStatus } from "../dictionary/entities/dictionary.entity";

/** services-registry 集合每行的形状(form 协议 schema 管录入,这里只做运行时防御) */
interface RegisteredService {
    name: string;
    baseUrl: string;
    healthPath?: string;
    metricsPath?: string;
    enabled?: boolean;
}

export interface ServiceStatus {
    key: string;
    name: string;
    baseUrl: string;
    ok: boolean;
    latencyMs: number | null;
    error?: string;
    metrics?: unknown;
    checkedAt: string;
}

const PROBE_INTERVAL_MS = 15_000;
const PROBE_TIMEOUT_MS = 3_000;

/**
 * 服务探测器:定时读 services-registry 集合(清单是部署配置,管理端集合页可改,
 * 改完下一轮生效,不用重启),逐个拉 health 与 metrics-lite。
 * 状态只存内存——探测结果是易失的,重启后 15s 内自然重建,落库是浪费。
 * 方向是"基座主动探",不是服务心跳自注册:自注册需要服务身份凭据,那是
 * service token 的事,现在没有。
 */
@Injectable()
export class ServiceProbeService implements OnApplicationBootstrap {
    private readonly logger = new Logger(ServiceProbeService.name);
    private readonly statuses = new Map<string, ServiceStatus>();

    constructor(
        @InjectRepository(DictionaryEntity)
        private readonly dictRepo: Repository<DictionaryEntity>,
    ) {}

    onApplicationBootstrap(): void {
        // 启动即探一轮,别让面板等第一个 interval
        void this.probeAll().catch((e) => this.logger.warn(`首轮探测失败: ${e?.message ?? e}`));
    }

    @Interval(PROBE_INTERVAL_MS)
    async probeAll(): Promise<void> {
        const rows = await this.dictRepo.find({
            where: { collection: "services-registry", status: DictionaryStatus.ACTIVE },
            order: { sortOrder: "ASC" },
        });
        const seen = new Set<string>();
        await Promise.all(
            rows.map(async (row) => {
                const svc = (row.value ?? {}) as RegisteredService;
                if (!svc.baseUrl || svc.enabled === false) return;
                seen.add(row.key);
                this.statuses.set(row.key, await this.probeOne(row.key, svc));
            }),
        );
        // 清单里删掉/停用的服务,状态也跟着消失,面板不留鬼影
        for (const key of this.statuses.keys()) {
            if (!seen.has(key)) this.statuses.delete(key);
        }
    }

    private async probeOne(key: string, svc: RegisteredService): Promise<ServiceStatus> {
        const base: ServiceStatus = {
            key,
            name: svc.name || key,
            baseUrl: svc.baseUrl,
            ok: false,
            latencyMs: null,
            checkedAt: new Date().toISOString(),
        };
        const started = Date.now();
        try {
            const res = await this.fetchWithTimeout(new URL(svc.healthPath || "/health", svc.baseUrl).href);
            base.latencyMs = Date.now() - started;
            base.ok = res.ok;
            if (!res.ok) base.error = `health HTTP ${res.status}`;
        } catch (e: any) {
            base.latencyMs = Date.now() - started;
            base.error = e?.name === "AbortError" ? `超时(${PROBE_TIMEOUT_MS}ms)` : String(e?.message ?? e);
            return base;
        }
        // metrics 是可选的锦上添花,拉不到不影响 ok 判定
        if (svc.metricsPath) {
            try {
                const res = await this.fetchWithTimeout(new URL(svc.metricsPath, svc.baseUrl).href);
                if (res.ok) base.metrics = await res.json();
            } catch { /* 静默:health 过了就算活着 */ }
        }
        return base;
    }

    private async fetchWithTimeout(url: string): Promise<Response> {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
        try {
            return await fetch(url, { signal: ctrl.signal });
        } finally {
            clearTimeout(timer);
        }
    }

    getStatus(): ServiceStatus[] {
        return [...this.statuses.values()];
    }
}

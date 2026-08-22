import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { getConnection } from "typeorm";

/**
 * 连接池医生：定期探测，池死了就地销毁重建。
 *
 * 背景：容器化 MySQL 在 mac 上无论端口转发还是 .orb.local 直连都要过
 * OrbStack 网络层，闲置/网络漂移(VPN 切换)时 TCP 被静默丢弃——服务端
 * processlist 显示 Sleep，客户端写入永远无响应。TCP keepalive 探测同样
 * 石沉大海，mysql2 2.2.5 也不认 idleTimeout。
 *
 * 第一版只做"定时摸连接保鲜"，结果被死连接反杀：探测查询没有超时，
 * 写进死 socket 后悬在 TCP 重传里十几分钟，allSettled 永远等不齐，
 * 告警都喊不出来；又没防重入，后续轮次全部进池的等待队列，雪崩。
 * 教训：自愈机制自己必须先愈——探测必须带硬超时，救治必须是重建而不是等待。
 *
 * 现在的行为：
 *   每 45s 并发摸满整池（防闲置被掐）；8s 内没摸完即判池死，
 *   close + connect 整池重建（悬死的查询随 close 一并了断）。
 * mysql2 升 3.x(idleTimeout 生效)后本服务可移除。
 */
@Injectable()
export class PoolKeepaliveService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PoolKeepaliveService.name);
    private timer: ReturnType<typeof setInterval> | null = null;
    private busy = false; // 防重入:上一轮没结束(探测或重建中)就跳过本轮

    private readonly INTERVAL_MS = 45000;
    private readonly PROBE_TIMEOUT_MS = 8000;
    private readonly POOL_SIZE = 10; // 与 TypeORM extra.connectionLimit 一致

    onModuleInit(): void {
        this.timer = setInterval(() => void this.checkAndHeal(), this.INTERVAL_MS);
        if (typeof this.timer.unref === "function") this.timer.unref();
        this.logger.log(`连接池医生已上岗（每 ${this.INTERVAL_MS / 1000}s 探测，${this.PROBE_TIMEOUT_MS / 1000}s 无响应即重建池）`);
    }

    onModuleDestroy(): void {
        if (this.timer) clearInterval(this.timer);
    }

    private async checkAndHeal(): Promise<void> {
        if (this.busy) return;
        this.busy = true;
        try {
            const conn = getConnection();
            if (!conn.isConnected) return;

            // 摸满整池;探测本身必须有硬超时,否则死连接会把医生一起拖死(第一版的教训)
            const probe = Promise.allSettled(
                Array.from({ length: this.POOL_SIZE }, () => conn.query("SELECT 1")),
            );
            const verdict = await Promise.race([
                probe.then((rs) => (rs.every((r) => r.status === "fulfilled") ? "ok" : "partial")),
                new Promise<"dead">((resolve) => setTimeout(() => resolve("dead"), this.PROBE_TIMEOUT_MS)),
            ]);

            if (verdict === "dead") {
                this.logger.warn("连接池探测超时,判定整池死亡,销毁重建…");
                await conn.close().catch((e) => this.logger.warn(`关闭旧池: ${e?.message}`));
                await conn.connect();
                this.logger.log("连接池已重建");
            } else if (verdict === "partial") {
                // 个别失败:mysql2 会把报错的坏连接踢出池,下一轮自然换新,记一笔即可
                this.logger.warn("保鲜探测存在失败连接(已由池剔除)");
            }
        } catch (e: any) {
            this.logger.warn(`池医生异常: ${e?.message}`);
        } finally {
            this.busy = false;
        }
    }
}

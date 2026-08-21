import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { getConnection } from "typeorm";

/**
 * 连接池保鲜心跳。
 *
 * 背景：容器化 MySQL 在 mac 上无论走端口转发还是 .orb.local 直连，都要过
 * OrbStack 的网络层，闲置十几分钟的 TCP 会被静默丢弃——服务端 processlist
 * 显示 Sleep，客户端写入永远无响应，整池死连接，SELECT 1 都超时。
 * 实测两条"正路"都堵死：TCP keepalive 探测同样石沉大海（不回 RST，系统级
 * 重试要 10 分钟才判死）；mysql2 的 idleTimeout 要 3.x，锁的 2.2.5 不认。
 *
 * 所以用最笨但确定有效的办法：定时把整池连接都摸一遍，让每个连接的闲置
 * 时间永远到不了被丢弃的阈值。并发数取池上限，保证不是只保鲜借到的那一个。
 * 每 45 秒 10 个 SELECT 1，开销可以忽略。升级 mysql2 3.x 后可移除。
 */
@Injectable()
export class PoolKeepaliveService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PoolKeepaliveService.name);
    private timer: ReturnType<typeof setInterval> | null = null;

    private readonly INTERVAL_MS = 45000;
    private readonly POOL_SIZE = 10; // 与 TypeORM extra.connectionLimit 一致

    onModuleInit(): void {
        this.timer = setInterval(() => void this.touchPool(), this.INTERVAL_MS);
        // 不阻止进程退出
        if (typeof this.timer.unref === "function") this.timer.unref();
        this.logger.log(`连接池保鲜心跳已启动（每 ${this.INTERVAL_MS / 1000}s 摸 ${this.POOL_SIZE} 个连接）`);
    }

    onModuleDestroy(): void {
        if (this.timer) clearInterval(this.timer);
    }

    private async touchPool(): Promise<void> {
        try {
            const conn = getConnection();
            if (!conn.isConnected) return;
            const results = await Promise.allSettled(
                Array.from({ length: this.POOL_SIZE }, () => conn.query("SELECT 1")),
            );
            const failed = results.filter((r) => r.status === "rejected").length;
            if (failed > 0) {
                // 有失败说明部分连接已死,mysql2 会在失败后把坏连接踢出池,
                // 下一轮心跳等价于重建——这正是想要的自愈行为
                this.logger.warn(`保鲜心跳 ${failed}/${this.POOL_SIZE} 个连接失败(坏连接将被池剔除)`);
            }
        } catch (e: any) {
            this.logger.warn(`保鲜心跳异常: ${e?.message}`);
        }
    }
}

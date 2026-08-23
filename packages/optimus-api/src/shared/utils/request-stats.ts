import { monitorEventLoopDelay } from "node:perf_hooks";
import type { NextFunction, Request, Response } from "express";

/**
 * 进程级轻量指标——给 /metrics-lite 用的自采样,不是 Prometheus。
 * 服务数上来要标准 /metrics 时,这里的采样源直接复用,只换输出格式。
 */
const loopDelay = monitorEventLoopDelay({ resolution: 20 });
loopDelay.enable();

// 请求统计用两个分钟桶滚动:够回答"最近一分钟量与均值",不存明细
let total = 0;
let bucketStart = Date.now();
let bucketCount = 0;
let bucketDurMs = 0;
let lastMinute = { count: 0, avgMs: 0 };

function roll(now: number): void {
    if (now - bucketStart >= 60_000) {
        lastMinute = { count: bucketCount, avgMs: bucketCount ? Math.round(bucketDurMs / bucketCount) : 0 };
        bucketStart = now;
        bucketCount = 0;
        bucketDurMs = 0;
    }
}

export function requestStatsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const started = Date.now();
    res.on("finish", () => {
        const now = Date.now();
        roll(now);
        total += 1;
        bucketCount += 1;
        bucketDurMs += now - started;
    });
    next();
}

export function metricsSnapshot(): Record<string, unknown> {
    roll(Date.now());
    const mem = process.memoryUsage();
    return {
        pid: process.pid,
        uptimeSec: Math.round(process.uptime()),
        memory: { rssMB: +(mem.rss / 1048576).toFixed(1), heapUsedMB: +(mem.heapUsed / 1048576).toFixed(1) },
        // histogram 单位是纳秒
        eventLoopMs: {
            p50: +(loopDelay.percentile(50) / 1e6).toFixed(2),
            p99: +(loopDelay.percentile(99) / 1e6).toFixed(2),
            max: +(loopDelay.max / 1e6).toFixed(2),
        },
        requests: { total, lastMinute },
    };
}

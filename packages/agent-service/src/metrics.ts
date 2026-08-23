/**
 * 进程轻量指标,形状与 optimus-api 的 /metrics-lite 一致——探测器只认一种形状。
 * 两边不抽公共包:就几十行,为它建包不值得,形状对齐靠验收用例盯。
 */
import { monitorEventLoopDelay } from "node:perf_hooks";
import type { NextFunction, Request, Response } from "express";

const loopDelay = monitorEventLoopDelay({ resolution: 20 });
loopDelay.enable();

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
        eventLoopMs: {
            p50: +(loopDelay.percentile(50) / 1e6).toFixed(2),
            p99: +(loopDelay.percentile(99) / 1e6).toFixed(2),
            max: +(loopDelay.max / 1e6).toFixed(2),
        },
        requests: { total, lastMinute },
    };
}

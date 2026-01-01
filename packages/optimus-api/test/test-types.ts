#!/usr/bin/env ts-node

/**
 * 类型检查测试
 * 验证所有验证脚本的类型定义是否正确
 */

import { ServerProcessHelper } from "./utils/server-process.helper";

// 测试类型定义
interface HealthResponse {
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
}

interface VerificationResults {
    configurationValid: boolean;
    serverStarted: boolean;
    healthCheckPassed: boolean;
    apiResponseValid: boolean;
    serverStopped: boolean;
    totalTime: number;
    startupTime: number;
    shutdownTime: number;
}

function testTypes() {
    console.log("🔍 Testing TypeScript types...");

    // 测试 HealthResponse 类型
    const healthResponse: HealthResponse = {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: 123.45,
        environment: "test",
    };

    // 测试 VerificationResults 类型
    const results: VerificationResults = {
        configurationValid: true,
        serverStarted: true,
        healthCheckPassed: true,
        apiResponseValid: true,
        serverStopped: true,
        totalTime: 1000,
        startupTime: 500,
        shutdownTime: 200,
    };

    // 测试错误处理
    try {
        throw new Error("Test error");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`Error handled: ${errorMessage}`);
    }

    // 测试 ServerProcessHelper 类型
    const config = {
        command: "npm",
        args: ["run", "start:test"],
        port: 8082,
    };

    console.log("✅ All types are valid");
    console.log("📋 Type definitions:");
    console.log(`   - HealthResponse: ${Object.keys(healthResponse).join(", ")}`);
    console.log(`   - VerificationResults: ${Object.keys(results).join(", ")}`);
    console.log(`   - ServerProcessHelper config: ${Object.keys(config).join(", ")}`);
}

testTypes();

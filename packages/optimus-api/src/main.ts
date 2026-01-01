// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
import "./instrument";

import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import * as Sentry from "@sentry/nestjs";

import express from "express";

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { useContainer } from "class-validator";

import { AppModule } from "./app.module";

import { logger } from "./shared/libs/log4js/logger.middleware";
import { Logger } from "./shared/libs/log4js/log4j.util";
import { TransformInterceptor } from "./shared/libs/log4js/transform.interceptor";
import { HttpExceptionsFilter } from "./shared/libs/log4js/http-exceptions-filter";
import { ExceptionsFilter } from "./shared/libs/log4js/exceptions-filter";
import { initializeLogDirectory } from "./shared/utils/log-init";
import { SentryLoggerService } from "./shared/libs/sentry-logger.service";

async function bootstrap() {
    // 初始化日志目录
    try {
        initializeLogDirectory();
    } catch (error) {
        console.error("Failed to initialize logging system:", error.message);
        Sentry.captureException(error, {
            tags: { component: "log-init", phase: "startup" },
        });
        process.exit(1);
    }

    let app;
    try {
        // 使用自定义 Logger 来捕获所有日志并上报到 Sentry
        app = await NestFactory.create(AppModule, {
            cors: true,
            logger: new SentryLoggerService(),
        });

        // 启用 class-validator 的依赖注入
        // 这样自定义验证装饰器可以注入 NestJS 的服务
        useContainer(app.select(AppModule), { fallbackOnErrors: true });
    } catch (error) {
        console.error("Failed to create NestJS application:", error);
        Sentry.captureException(error, {
            tags: { component: "app-creation", phase: "startup" },
        });
        // 确保 Sentry 有时间发送错误
        await Sentry.flush(2000);
        process.exit(1);
    }

    // 设置访问频率 - 已大幅放宽限制
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000, // 15分钟
            max: 100000, // 限制15分钟内最多只能访问100000次（已大幅放宽）
        }),
    );

    const config = app.get(ConfigService);

    // 设置 api 访问前缀
    const prefix = config.get("app.prefix") as string;
    app.setGlobalPrefix(prefix);

    // web 安全，防常见漏洞
    // 配置 helmet 允许加载 OSS 图片
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    // 允许加载来自任何 HTTPS 源的图片（包括阿里云 OSS、MinIO 等）
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }),
    );

    const swaggerOptions = new DocumentBuilder()
        .setTitle("Optimus App")
        .setDescription("Optimus App 接口文档")
        .setVersion("0.0.1")
        .addBearerAuth()
        .addTag("文章管理", "文章的创建、查询、更新、发布和删除操作")
        .addTag("分类管理", "文章分类的管理，包括内置分类和自定义分类")
        .addTag("文章版本管理", "文章版本控制、历史记录和版本回退功能")
        .build();
    const document = SwaggerModule.createDocument(app, swaggerOptions);
    // 项目依赖当前文档功能，最好不要改变当前地址
    // 生产环境使用 nginx 可以将当前文档地址 屏蔽外部访问
    SwaggerModule.setup("/api/docs", app, document);

    // 配置UI代理：将非 /api/* 请求代理到UI服务器
    const uiPort = process.env.PORT || 8082;
    const uiProxy = createProxyMiddleware({
        target: `http://localhost:${uiPort}`,
        changeOrigin: true,
        ws: true, // 支持WebSocket升级
        logLevel: "info",
        onProxyReq: (proxyReq, req, res) => {
            // 只在开发环境记录静态资源代理日志，生产环境隐藏以减少日志噪音
            if (process.env.NODE_ENV === "development") {
                Logger.log(`Proxying ${req.method} ${req.url} -> http://localhost:${uiPort}${req.url}`, "UI Proxy");
            }
        },
        onError: (err, req, res) => {
            // 错误日志始终记录
            Logger.error(`Proxy error: ${err.message}`, "UI Proxy Error");
        },
    });

    // 获取Express实例并添加代理中间件
    // 匹配所有非 /api/* 和 /health 的请求
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use((req, res, next) => {
        // 如果请求路径以 /api 开头或是 /health，跳过代理
        if (req.path.startsWith("/api") || req.path === "/health") {
            return next();
        }
        // 其他请求代理到UI服务器
        return uiProxy(req, res, next);
    });

    // 防止跨站请求伪造
    // 设置 csrf 保存 csrfToken
    // app.use(csurf())

    // 全局验证
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            enableDebugMessages: true, // 开发环境
            disableErrorMessages: false,
        }),
    );

    // 日志
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));
    app.use(logger);
    // 使用全局拦截器打印出参
    app.useGlobalInterceptors(new TransformInterceptor());
    // 所有异常
    app.useGlobalFilters(new ExceptionsFilter());
    app.useGlobalFilters(new HttpExceptionsFilter());
    // 获取配置端口
    const port = (config.get("app.port") as number) || 8080;

    await app.listen(port);

    const appLocalPath = await app.getUrl();

    Logger.log(appLocalPath, "服务启动成功");
}

bootstrap().catch((error) => {
    console.error("Application failed to start:", error);
    Sentry.captureException(error, {
        tags: { component: "bootstrap", phase: "startup" },
        level: "fatal",
    });
    // 确保 Sentry 有时间发送错误
    Sentry.flush(2000).then(() => {
        process.exit(1);
    });
});

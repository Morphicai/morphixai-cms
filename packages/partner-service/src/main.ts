import "reflect-metadata";
import { join } from "path";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { requestStatsMiddleware } from "./shared/utils/request-stats";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

    // 管理页(合伙人列表/冻结解冻/外部任务审核)是纯静态 HTML+admin-embed UMD 脚本,
    // 零构建,直接托管在这个进程里,不单开一个前端服务——这是服务目录 embed 入口
    // (entryType=embed)实际要加载的地址
    app.useStaticAssets(join(__dirname, "..", "public"));

    const swaggerOptions = new DocumentBuilder()
        .setTitle("Partner Service")
        .setDescription("合伙人/积分/外部任务子服务")
        .setVersion("0.0.1")
        .addBearerAuth()
        .build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerOptions));

    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    // C 端接口靠 clientAccessToken httpOnly cookie 识别身份,IntrospectAuthGuard
    // 的 client 模式要读 req.cookies,没这行 cookie 永远是 undefined
    app.use(cookieParser());
    app.use(requestStatsMiddleware);

    const config = app.get(ConfigService);
    const port = config.get<string>("APP_PORT") || 8089;
    await app.listen(port);

    Logger.log(await app.getUrl(), "partner-service 启动成功");
}

bootstrap().catch((error) => {
    console.error("partner-service 启动失败:", error);
    process.exit(1);
});

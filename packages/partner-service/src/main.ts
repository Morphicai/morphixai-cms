import "reflect-metadata";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { requestStatsMiddleware } from "./shared/utils/request-stats";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { cors: true });

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

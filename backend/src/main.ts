import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ValidationErrorFilter } from "./common/filters/validation-error.filter";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ClinicAuthMiddleware } from "./common/middlewares/clinic-auth.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 註冊全域異常過濾器（LIFO 順序：最後註冊 = 最先執行）
  // AllExceptionsFilter 最先註冊 → 最後執行（兜底）
  // HttpExceptionFilter 次之 → 處理所有 HttpException（401/403/404 等）
  // ValidationErrorFilter 最後 → 最先執行，優先捕獲驗證錯誤
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
    new ValidationErrorFilter(),
  );

  // 啟用 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  // 設置全域 API 前綴
  app.setGlobalPrefix("api");

  // 註冊診所隔離中間件（排除文檔和健康檢查路由）
  const clinicMiddleware = new ClinicAuthMiddleware();
  app.use((req, res, next) => {
    // 排除 Swagger 文檔路由和健康檢查路由
    if (req.path.startsWith("/api/docs") || req.path === "/api/health") {
      return next();
    }
    return clinicMiddleware.use(req, res, next);
  });

  // 配置 Swagger 文檔
  const config = new DocumentBuilder()
    .setTitle("Doctor CRM API")
    .setDescription("醫療診所客戶關係管理系統 API 文檔")
    .setVersion("1.0")
    .addTag("patients", "患者管理")
    .addTag("treatments", "療程管理")
    .addTag("staff", "員工管理")
    .addTag("revenue", "分潤管理")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    customSiteTitle: "Doctor CRM API Docs",
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

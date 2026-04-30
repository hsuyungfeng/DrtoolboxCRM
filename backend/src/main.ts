import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ValidationErrorFilter } from "./common/filters/validation-error.filter";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ClinicAuthMiddleware } from "./common/middlewares/clinic-auth.middleware";
import { ClinicGuard } from "./common/guards/clinic.guard";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const reflector = app.get(Reflector);

  // 註冊全域異常過濾器（順序重要：後註冊的先執行，所以 AllExceptionsFilter 放在最前面作為最後退路）
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
    new ValidationErrorFilter(),
  );

  // 註冊全域守衛 (JwtAuthGuard 必須在 ClinicGuard 之前)
  app.useGlobalGuards(new JwtAuthGuard(reflector), new ClinicGuard(reflector));

  // 啟用 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  // 設置全域 API 前綴
  app.setGlobalPrefix("api");

  // 註冊診所隔離中間件（排除認證、文檔和健康檢查路由）
  const clinicMiddleware = new ClinicAuthMiddleware();
  app.use((req, res, next) => {
    const path = req.path;
    // 排除不需要診所隔離的路由
    if (
      path === "/api" || 
      path === "/api/" ||
      path.startsWith("/api/auth") ||
      path.startsWith("/api/docs") ||
      path === "/api/health"
    ) {
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const swagger_1 = require("@nestjs/swagger");
const clinic_auth_middleware_1 = require("./common/middlewares/clinic-auth.middleware");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter(), new all_exceptions_filter_1.AllExceptionsFilter());
    app.enableCors({
        origin: process.env.CORS_ORIGIN || true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    const clinicMiddleware = new clinic_auth_middleware_1.ClinicAuthMiddleware();
    app.use((req, res, next) => {
        if (req.path.startsWith('/api/docs') || req.path === '/api/health') {
            return next();
        }
        return clinicMiddleware.use(req, res, next);
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Doctor CRM API')
        .setDescription('醫療診所客戶關係管理系統 API 文檔')
        .setVersion('1.0')
        .addTag('patients', '患者管理')
        .addTag('treatments', '療程管理')
        .addTag('staff', '員工管理')
        .addTag('revenue', '分潤管理')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'Doctor CRM API Docs',
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });
    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
//# sourceMappingURL=main.js.map
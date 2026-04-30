import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { databaseConfig } from "./config/database.config";
import { PatientsModule } from "./patients/patients.module";
import { TreatmentsModule } from "./treatments/treatments.module";
import { StaffModule } from "./staff/staff.module";
import { RevenueModule } from "./revenue/revenue.module";
import { AuthModule } from "./auth/auth.module";
import { PointsModule } from "./points/points.module";
import { ReferralsModule } from "./referrals/referrals.module";
import { TreatmentTemplatesModule } from "./treatment-templates/treatment-templates.module";
import { AuditModule } from "./common/audit";
import { AiModule } from "./ai/ai.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { DoctorToolboxSyncModule } from "./doctor-toolbox-sync/doctor-toolbox-sync.module";
import { AttributesModule } from "./common/attributes/attributes.module";
import { LeadsModule } from "./leads/leads.module";
import { AnalyticsModule } from "./analytics/analytics.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || "60000", 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || "60", 10),
      },
    ]),
    TypeOrmModule.forRoot(databaseConfig),
    EventEmitterModule.forRoot(),
    AuditModule,
    AiModule,
    NotificationsModule,
    AuthModule,
    PatientsModule,
    TreatmentsModule,
    TreatmentTemplatesModule,
    StaffModule,
    RevenueModule,
    PointsModule,
    ReferralsModule,
    DoctorToolboxSyncModule,
    AttributesModule,
    LeadsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

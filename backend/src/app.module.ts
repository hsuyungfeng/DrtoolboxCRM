import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";
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

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    EventEmitterModule.forRoot(),
    AuthModule,
    PatientsModule,
    TreatmentsModule,
    StaffModule,
    RevenueModule,
    PointsModule,
    ReferralsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

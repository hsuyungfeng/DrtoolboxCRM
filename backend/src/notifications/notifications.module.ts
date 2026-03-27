import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ChurnPredictionService } from './churn-prediction.service';
import { NotificationService } from './services/notification.service';
import { NotificationSchedulerService } from './services/notification-scheduler.service';
import { NotificationEventListener } from './listeners/notification-event.listener';
import { NotificationsController } from './notifications.controller';
import { NotificationRecord } from './entities/notification-record.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { TreatmentSession } from '../treatments/entities/treatment-session.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { PointsBalance } from '../points/entities/points-balance.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      NotificationRecord,
      NotificationPreference,
      TreatmentSession,
      Treatment,
      Patient,
      PointsBalance,
    ]),
  ],
  providers: [
    ChurnPredictionService,
    NotificationService,
    NotificationSchedulerService,
    NotificationEventListener,
  ],
  controllers: [NotificationsController],
  exports: [ChurnPredictionService, NotificationService],
})
export class NotificationsModule {}

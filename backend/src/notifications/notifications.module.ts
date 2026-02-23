import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChurnPredictionService } from './churn-prediction.service';
import { NotificationService } from './notification.service';
import { NotificationsController } from './notifications.controller';
import { TreatmentSession } from '../treatments/entities/treatment-session.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { PointsBalance } from '../points/entities/points-balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TreatmentSession, Treatment, Patient, PointsBalance])],
  providers: [ChurnPredictionService, NotificationService],
  controllers: [NotificationsController],
  exports: [ChurnPredictionService, NotificationService],
})
export class NotificationsModule {}

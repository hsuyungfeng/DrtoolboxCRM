import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiTranscriptionService } from './ai-transcription.service';
import { AiController } from './ai.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Patient } from '../patients/entities/patient.entity';
import { Payment } from '../revenue/entities/payment.entity';
import { TreatmentCourse } from '../treatments/entities/treatment-course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, Payment, TreatmentCourse]),
  ],
  providers: [AiTranscriptionService, AnalyticsService],
  controllers: [AiController, AnalyticsController],
  exports: [AiTranscriptionService, AnalyticsService],
})
export class AiModule {}

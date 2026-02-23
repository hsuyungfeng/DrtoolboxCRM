import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentSession } from '../treatments/entities/treatment-session.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { PointsBalance } from '../points/entities/points-balance.entity';

export interface ChurnRisk {
  patientId: string;
  patientName: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskScore: number;
  reasons: string[];
  recommendedActions: string[];
  lastSessionDate?: Date;
  daysSinceLastSession?: number;
  unusedPoints?: number;
}

export interface PredictionConfig {
  clinicId: string;
  noSessionDaysThreshold: number;
  unusedPointsThreshold: number;
  minRiskScore: number;
}

@Injectable()
export class ChurnPredictionService {
  private readonly logger = new Logger(ChurnPredictionService.name);

  constructor(
    @InjectRepository(TreatmentSession)
    private sessionRepository: Repository<TreatmentSession>,
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(PointsBalance)
    private pointsRepository: Repository<PointsBalance>,
  ) {}

  async analyzeChurnRisk(config: PredictionConfig): Promise<ChurnRisk[]> {
    const { clinicId, noSessionDaysThreshold = 30, unusedPointsThreshold = 100 } = config;

    const patients = await this.patientRepository.find({
      where: { clinicId },
    });

    const risks: ChurnRisk[] = [];

    for (const patient of patients) {
      const risk = await this.calculatePatientRisk(patient, {
        noSessionDaysThreshold,
        unusedPointsThreshold,
      });
      if (risk && risk.riskScore >= config.minRiskScore) {
        risks.push(risk);
      }
    }

    return risks.sort((a, b) => b.riskScore - a.riskScore);
  }

  private async calculatePatientRisk(
    patient: Patient,
    config: { noSessionDaysThreshold: number; unusedPointsThreshold: number },
  ): Promise<ChurnRisk | null> {
    const { noSessionDaysThreshold, unusedPointsThreshold } = config;

    const treatment = await this.treatmentRepository.findOne({
      where: { patientId: patient.id },
      order: { createdAt: 'DESC' },
    });

    const lastSession = treatment
      ? await this.sessionRepository.findOne({
          where: { treatmentId: treatment.id },
          order: { scheduledTime: 'DESC' },
        })
      : null;

    const now = new Date();
    const daysSinceLastSession = lastSession?.scheduledTime
      ? Math.floor((now.getTime() - new Date(lastSession.scheduledTime).getTime()) / (1000 * 60 * 60 * 24))
      : noSessionDaysThreshold * 2;

    const pointsBalance = await this.pointsRepository.findOne({
      where: {
        customerId: patient.id,
        customerType: 'patient',
        clinicId: patient.clinicId,
      },
    });

    const unusedPoints = pointsBalance?.balance || 0;

    let riskScore = 0;
    const reasons: string[] = [];
    const recommendedActions: string[] = [];

    if (daysSinceLastSession > noSessionDaysThreshold) {
      riskScore += 40;
      reasons.push(`超過 ${daysSinceLastSession} 天未進行療程`);
      recommendedActions.push('主動聯繫關懷');
    }

    if (unusedPoints >= unusedPointsThreshold) {
      riskScore += 30;
      reasons.push(`有 ${unusedPoints} 點數未使用即將過期`);
      recommendedActions.push('提醒患者使用點數');
    }

    if (treatment) {
      const incompleteSessions = await this.sessionRepository.count({
        where: {
          treatmentId: treatment.id,
          completionStatus: 'pending',
        },
      });

      if (incompleteSessions > 0) {
        riskScore += 20;
        reasons.push(`有 ${incompleteSessions} 次療程未完成`);
        recommendedActions.push('安排補完療程');
      }
    }

    const totalSessions = lastSession ? 1 : 0;
    if (totalSessions > 0 && totalSessions < 3) {
      riskScore += 10;
      reasons.push('新患者，可能尚未建立習慣');
      recommendedActions.push('提供首次體驗優惠');
    }

    if (riskScore === 0) {
      return null;
    }

    let riskLevel: 'high' | 'medium' | 'low' = 'low';
    if (riskScore >= 70) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';

    return {
      patientId: patient.id,
      patientName: patient.name,
      riskLevel,
      riskScore,
      reasons,
      recommendedActions,
      lastSessionDate: lastSession?.scheduledTime ? new Date(lastSession.scheduledTime) : undefined,
      daysSinceLastSession,
      unusedPoints,
    };
  }

  async getChurnSummary(clinicId: string): Promise<{
    totalPatients: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    topAtRiskPatients: ChurnRisk[];
  }> {
    const risks = await this.analyzeChurnRisk({
      clinicId,
      noSessionDaysThreshold: 30,
      unusedPointsThreshold: 100,
      minRiskScore: 1,
    });

    return {
      totalPatients: risks.length,
      highRisk: risks.filter((r) => r.riskLevel === 'high').length,
      mediumRisk: risks.filter((r) => r.riskLevel === 'medium').length,
      lowRisk: risks.filter((r) => r.riskLevel === 'low').length,
      topAtRiskPatients: risks.slice(0, 10),
    };
  }
}

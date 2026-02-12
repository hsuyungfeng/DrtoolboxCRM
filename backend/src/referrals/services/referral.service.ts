import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from '../entities/referral.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { PointsService } from '../../points/services/points.service';
import { PointsConfigService } from '../../points/services/points-config.service';
import { CreateReferralDto } from '../dto/create-referral.dto';

/**
 * 推薦統計數據
 */
export interface ReferralStats {
  totalReferrals: number;
  convertedCount: number;
  pendingCount: number;
  cancelledCount: number;
  conversionRate: number; // 百分比 0-100
  totalPointsAwarded: number;
}

/**
 * ReferralService - 推薦業務邏輯
 */
@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(Treatment)
    private readonly treatmentRepository: Repository<Treatment>,
    private readonly pointsService: PointsService,
    private readonly pointsConfigService: PointsConfigService,
  ) {}

  /**
   * 創建推薦記錄
   * @param createReferralDto 推薦數據
   * @returns 新創建的推薦記錄
   * @throws ConflictException 如果患者已有未決推薦
   */
  async createReferral(createReferralDto: CreateReferralDto): Promise<Referral> {
    const { referrerId, referrerType, patientId, clinicId, notes } = createReferralDto;

    // 檢查患者是否已有未決推薦
    const existingReferral = await this.referralRepository.findOne({
      where: {
        patientId,
        clinicId,
        status: 'pending',
      },
    });

    if (existingReferral) {
      throw new ConflictException(`患者 ${patientId} 已有一個未決推薦記錄`);
    }

    // 創建推薦記錄
    const referral = this.referralRepository.create({
      referrerId,
      referrerType,
      patientId,
      clinicId,
      referralDate: new Date(),
      status: 'pending',
      notes,
      pointsAwarded: 0,
    });

    const savedReferral = await this.referralRepository.save(referral);
    this.logger.log(
      `成功創建推薦記錄：${savedReferral.id}（推薦人：${referrerId}，患者：${patientId}）`
    );

    return savedReferral;
  }

  /**
   * 按推薦人查詢推薦記錄
   * @param referrerId 推薦人 ID
   * @param referrerType 推薦人類型
   * @param clinicId 診所 ID
   * @returns 推薦記錄列表
   */
  async getReferralsByReferrer(
    referrerId: string,
    referrerType: string,
    clinicId: string,
  ): Promise<Referral[]> {
    return await this.referralRepository.find({
      where: {
        referrerId,
        referrerType,
        clinicId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 按患者查詢推薦記錄
   * @param patientId 患者 ID
   * @param clinicId 診所 ID
   * @returns 推薦記錄（或 null 如果不存在）
   */
  async getReferralByPatient(patientId: string, clinicId: string): Promise<Referral | null> {
    return await this.referralRepository.findOne({
      where: {
        patientId,
        clinicId,
      },
    });
  }

  /**
   * 轉化推薦記錄
   * 標記推薦為已轉化，並獎勵推薦人點數
   * @param referralId 推薦記錄 ID
   * @param treatmentId 首次療程 ID
   * @param clinicId 診所 ID
   * @returns 已轉化的推薦記錄
   * @throws NotFoundException 推薦不存在
   * @throws BadRequestException 推薦已轉化或不符合首次療程條件
   */
  async convertReferral(referralId: string, treatmentId: string, clinicId: string): Promise<Referral> {
    // 查詢推薦記錄（包含患者信息）
    const referral = await this.referralRepository.findOne({
      where: {
        id: referralId,
        clinicId,
      },
      relations: ['patient'],
    });

    if (!referral) {
      throw new NotFoundException(`推薦記錄 ${referralId} 不存在`);
    }

    // 檢查推薦狀態
    if (referral.status !== 'pending') {
      throw new BadRequestException(
        `推薦記錄已處於 "${referral.status}" 狀態，無法再次轉化`
      );
    }

    // 檢查患者是否已有其他療程（首次療程檢測）
    const existingTreatmentCount = await this.treatmentRepository.count({
      where: [
        {
          patientId: referral.patientId,
          clinicId,
          status: 'completed',
        },
        {
          patientId: referral.patientId,
          clinicId,
          status: 'in_progress',
        },
      ],
    });

    if (existingTreatmentCount > 0) {
      throw new BadRequestException(
        `患者 ${referral.patientId} 已有其他療程，此推薦不符合首次療程條件`
      );
    }

    // 獲取推薦獎勵點數配置
    const rewardPoints = await this.pointsConfigService.getConfigByKey(
      'referral_points_reward',
      clinicId,
    );

    // 驗證推薦人存在且有效
    await this.validateReferrer(referral.referrerId, referral.referrerType, clinicId);

    // 獎勵推薦人點數
    try {
      await this.pointsService.awardPoints(
        referral.referrerId,
        rewardPoints,
        'referral',
        clinicId,
        referralId,
      );
    } catch (error) {
      this.logger.error(`獎勵推薦人點數失敗：${error.message}`);
      throw new BadRequestException(`無法獎勵推薦人點數：${error.message}`);
    }

    // 更新推薦記錄
    referral.status = 'converted';
    referral.firstTreatmentId = treatmentId;
    referral.firstTreatmentDate = new Date();
    referral.pointsAwarded = rewardPoints;

    const savedReferral = await this.referralRepository.save(referral);
    this.logger.log(
      `成功轉化推薦記錄：${referralId}（推薦人：${referral.referrerId}，獎勵：${rewardPoints} 點）`
    );

    return savedReferral;
  }

  /**
   * 獲取推薦統計數據
   * @param clinicId 診所 ID
   * @returns 推薦統計信息
   */
  async getReferralStats(clinicId: string): Promise<ReferralStats> {
    // 獲取總推薦數
    const totalReferrals = await this.referralRepository.count({
      where: { clinicId },
    });

    // 獲取所有推薦記錄以計算細節
    const referrals = await this.referralRepository.find({
      where: { clinicId },
    });

    const convertedCount = referrals.filter((r) => r.status === 'converted').length;
    const pendingCount = referrals.filter((r) => r.status === 'pending').length;
    const cancelledCount = referrals.filter((r) => r.status === 'cancelled').length;

    const conversionRate = totalReferrals > 0 ? (convertedCount / totalReferrals) * 100 : 0;

    const totalPointsAwarded = referrals.reduce((sum, r) => sum + Number(r.pointsAwarded), 0);

    return {
      totalReferrals,
      convertedCount,
      pendingCount,
      cancelledCount,
      conversionRate,
      totalPointsAwarded,
    };
  }

  /**
   * 取消推薦記錄
   * @param referralId 推薦記錄 ID
   * @param clinicId 診所 ID
   * @returns 已取消的推薦記錄
   * @throws NotFoundException 推薦不存在
   */
  async deleteReferral(referralId: string, clinicId: string): Promise<Referral> {
    const referral = await this.referralRepository.findOne({
      where: {
        id: referralId,
        clinicId,
      },
    });

    if (!referral) {
      throw new NotFoundException(`推薦記錄 ${referralId} 不存在`);
    }

    referral.status = 'cancelled';
    const savedReferral = await this.referralRepository.save(referral);
    this.logger.log(`成功取消推薦記錄：${referralId}`);

    return savedReferral;
  }

  /**
   * 驗證推薦人是否存在且有效
   * @param referrerId 推薦人 ID
   * @param referrerType 推薦人類型
   * @param clinicId 診所 ID
   * @throws NotFoundException 推薦人不存在
   * @throws BadRequestException 推薦人不符合資格
   */
  private async validateReferrer(
    referrerId: string,
    referrerType: string,
    clinicId: string,
  ): Promise<void> {
    if (referrerType === 'staff') {
      const staff = await this.staffRepository.findOne({
        where: {
          id: referrerId,
          clinicId,
        },
      });

      if (!staff) {
        throw new NotFoundException(`員工推薦人 ${referrerId} 不存在`);
      }

      if (!staff.canBeReferrer) {
        throw new BadRequestException(`員工 ${referrerId} 無權作為推薦人`);
      }

      if (staff.status !== 'active') {
        throw new BadRequestException(`員工 ${referrerId} 狀態非活躍`);
      }
    } else if (referrerType === 'patient') {
      const patient = await this.patientRepository.findOne({
        where: {
          id: referrerId,
          clinicId,
        },
      });

      if (!patient) {
        throw new NotFoundException(`患者推薦人 ${referrerId} 不存在`);
      }

      if (patient.status !== 'active') {
        throw new BadRequestException(`患者 ${referrerId} 狀態非活躍`);
      }
    }
  }
}
